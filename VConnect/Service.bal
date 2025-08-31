
import ballerina/http;
import ballerina/io;
import ballerina/jwt;
import ballerina/log;
import ballerina/mime;
import ballerina/sql;
import ballerina/time;

// jwt validation 
final jwt:ValidatorConfig validatorConfig = {
    audience: "VConnectClient",
    issuer: "VConnectAPI",
    signatureConfig: {secret: JWT_SECRET}
};

function validateAuth(http:Request req) returns error? {
    string authHeader = check req.getHeader("Authorization");
    if !authHeader.startsWith("Bearer ") {
        return error("Missing Bearer token");
    }
    string jwtToken = authHeader.substring(7);
    jwt:Payload|jwt:Error v = jwt:validate(jwtToken, validatorConfig);
    if v is jwt:Error {
        return error(v.message());
    }
    return ();
}

// Ensure caller is the target organization (matching orgId) or an admin.
function ensureOrgOrAdmin(http:Request req, int orgId) returns error? {
    string authHeader = check req.getHeader("Authorization");
    if !authHeader.startsWith("Bearer ") {
        return error("Unauthorized", message = "Missing Bearer token");
    }
    string jwtToken = authHeader.substring(7);
    jwt:Payload|jwt:Error v = jwt:validate(jwtToken, validatorConfig);
    if v is jwt:Error {
        return error("Unauthorized", message = v.message());
    }
    jwt:Payload payload = <jwt:Payload>v;
    anydata? typeJ = payload["user_type"];
    anydata? idJ = payload["user_id"];
    int callerId = -1;
    if idJ is int {
        callerId = idJ;
    }
    else if idJ is string {
        int|error parsed = 'int:fromString(idJ);
        if parsed is int {
            callerId = parsed;
        }
    }
    if !(typeJ is string) {
        return error("Forbidden", message = "Invalid user type");
    }
    if typeJ == "admin" {
        return ();
    }
    if typeJ == "organization" && callerId == orgId {
        return ();
    }
    return error("Forbidden", message = "Organization ownership or admin required");
}

listener http:Listener mainListener = new (9000);

@http:ServiceConfig {
    cors: {
   
        allowOrigins: ["http://localhost:5173", "http://localhost:5174"],
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
        allowCredentials: true,
        maxAge: 86400,
        exposeHeaders: ["Location", "Content-Length"]
    }
}
service /api/org on mainListener {
    resource function options .(http:Caller caller, http:Request req) returns error? {
        http:Response response = new;
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        response.statusCode = http:STATUS_NO_CONTENT;
        return caller->respond(response);
    }
// Organization updates the status of a volunteer's application for their event
    resource function patch events/[int event_id]/applications/[int application_id]/status(http:Caller caller, http:Request req) returns error? {
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
// Check that the caller is the organization that owns the event or admin
        int owningOrg = -1;
        {
            stream<record {|int oid;|}, sql:Error?> es = dbClient->query(`SELECT organization_id AS oid FROM events WHERE event_id = ${event_id}`);
            record {|record {|int oid;|} value;|}|sql:Error? en = es.next();
            sql:Error? ec = es.close();
            if ec is error {
                return ec;
            }
            if en is record {|record {|int oid;|} value;|} {
                owningOrg = en.value.oid;
            }
            else {
                http:Response r = new;
                r.statusCode = http:STATUS_NOT_FOUND;
                r.setJsonPayload({"error": "Event not found"});
                return caller->respond(r);
            }
        }
        string authHeader = "";
        {
            string|error h = req.getHeader("Authorization");
            if h is string {
                authHeader = h;
            }
        }
        string token = authHeader.substring(7);
        jwt:Payload|jwt:Error pv = jwt:validate(token, validatorConfig);
        if pv is jwt:Error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": pv.message()});
            return caller->respond(r);
        }
        jwt:Payload payload = <jwt:Payload>pv;
        anydata? typeJ = payload["user_type"];
        anydata? idJ = payload["user_id"];
        int callerOrg = -1;
        if idJ is int {
            callerOrg = idJ;
        } else if idJ is string {
            int|error p = 'int:fromString(idJ);
            if p is int {
                callerOrg = p;
            }
        }
        boolean allowed = false;
        if typeJ is string {
            if typeJ == "admin" {
                allowed = true;
            }
            else if typeJ == "organization" && callerOrg == owningOrg {
                allowed = true;
            }
        }
        if !allowed {
            http:Response r = new;
            r.statusCode = http:STATUS_FORBIDDEN;
            r.setJsonPayload({"error": "Organization ownership or admin required"});
            return caller->respond(r);
        }
        string newStatus = req.getQueryParamValue("status") ?: "pending";
        EventApplication|error app = updateEventApplicationStatus(application_id, newStatus);
        if app is EventApplication {
            return caller->respond(app);
        }
        http:Response r = new;
        string msg = (<error>app).message();
        r.statusCode = msg == "Application not found" ? http:STATUS_NOT_FOUND : http:STATUS_BAD_REQUEST;
        r.setJsonPayload({"error": msg});
        return caller->respond(r);
    }

    resource function get profile/[int id](http:Caller caller, http:Request req) returns error? {
        if id <= 0 {
            http:Response r = new;
            r.statusCode = http:STATUS_BAD_REQUEST;
            r.setJsonPayload({"error": "Invalid organization ID"});
            return caller->respond(r);
        }
        
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        error? ownErr = ensureOrgOrAdmin(req, id);
        if ownErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_FORBIDDEN;
            r.setJsonPayload({"error": (<error>ownErr).message()});
            return caller->respond(r);
        }
        OrgProfile|error p = ensureOrgProfile(id);
        if p is OrgProfile {
            OrgEvent[] evts = [];
            OrgEvent[]|error evRes = getOrgEvents(id);
            if evRes is OrgEvent[] {
                evts = evRes;
            }
            json resp = {
                organization_id: p.organization_id,
                description: p.description,
                address: p.address,
                website: p.website,
                is_verified: p.is_verified,
                events: evts
            };
            return caller->respond(resp);
        }
        string msg = (<error>p).message();
        http:Response r = new;
        r.statusCode = http:STATUS_INTERNAL_SERVER_ERROR;
        r.setJsonPayload({"error": msg});
        return caller->respond(r);
    }

    resource function post profile(OrgProfile body, http:Caller caller, http:Request req) returns error? {
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        if body.organization_id is int {
            error? ownErr = ensureOrgOrAdmin(req, <int>body.organization_id);
            if ownErr is error {
                http:Response r = new;
                r.statusCode = http:STATUS_FORBIDDEN;
                r.setJsonPayload({"error": (<error>ownErr).message()});
                return caller->respond(r);
            }
        }
        string|error res = createOrgProfile(body);
        if res is string {
            return caller->respond({message: res});
        }
        http:Response r = new;
        r.statusCode = http:STATUS_BAD_REQUEST;
        r.setJsonPayload({"error": res.message()});
        return caller->respond(r);
    }

    resource function put profile/[int id](OrgProfile body, http:Caller caller, http:Request req) returns error? {
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        error? ownErr = ensureOrgOrAdmin(req, id);
        if ownErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_FORBIDDEN;
            r.setJsonPayload({"error": (<error>ownErr).message()});
            return caller->respond(r);
        }
        string updated = check updateOrgProfile(id, body);
        check caller->respond({message: updated});
    }

    resource function get profile/self(http:Caller caller, http:Request req) returns error? {
        string authHeader = "";
        {
            string|error h = req.getHeader("Authorization");
            if h is string {
                authHeader = h;
            }
        }
        if !authHeader.startsWith("Bearer ") {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": "Missing Bearer token"});
            return caller->respond(r);
        }
        string token = authHeader.substring(7);
        jwt:Payload|jwt:Error pv = jwt:validate(token, validatorConfig);
        if pv is jwt:Error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": pv.message()});
            return caller->respond(r);
        }
        jwt:Payload payload = <jwt:Payload>pv;
        anydata? typeJ = payload["user_type"];
        anydata? idJ = payload["user_id"];
        int orgId = -1;
        if idJ is int {
            orgId = idJ;
        }
        else if idJ is string {
            int|error parsed = 'int:fromString(idJ);
            if parsed is int {
                orgId = parsed;
            }
        }
        if !(typeJ is string) || typeJ != "organization" || orgId < 0 {
            http:Response r = new;
            r.statusCode = http:STATUS_FORBIDDEN;
            r.setJsonPayload({"error": "Organization access required"});
            return caller->respond(r);
        }
        OrgProfile|error p = ensureOrgProfile(orgId);
        if p is OrgProfile {
            OrgEvent[] evts = [];
            OrgEvent[]|error evRes = getOrgEvents(orgId);
            if evRes is OrgEvent[] {
                evts = evRes;
            }
            json resp = {
                organization_id: p.organization_id,
                description: p.description,
                address: p.address,
                website: p.website,
                is_verified: p.is_verified,
                events: evts
            };
            return caller->respond(resp);
        }
        http:Response r = new;
        r.statusCode = http:STATUS_INTERNAL_SERVER_ERROR;
        r.setJsonPayload({"error": (<error>p).message()});
        return caller->respond(r);
    }

    resource function get events(http:Caller caller, http:Request req) returns error? {
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        stream<OrgEvent, sql:Error?> eventStream = dbClient->query(`SELECT * FROM events`);
        OrgEvent[] events = [];
        error? e = eventStream.forEach(function(OrgEvent event) {
            events.push(event);
        });
        if e is error {
            http:Response r = new;
            r.statusCode = http:STATUS_INTERNAL_SERVER_ERROR;
            r.setJsonPayload({"error": e.message()});
            return caller->respond(r);
        }
        check caller->respond(events);
    }

    resource function get events/[int organization_id](http:Caller caller, http:Request req) returns error? {
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        OrgEvent[] events = check getOrgEvents(organization_id);
        check caller->respond(events);
    }

    resource function post events(EventCreateRequest body, http:Caller caller, http:Request req) returns error? {
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        OrgEvent created = check createOrgEvent(body);
        check caller->respond(created);
    }

    resource function put events/[int event_id](EventCreateRequest body, http:Caller caller, http:Request req) returns error? {
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        OrgEvent updated = check updateOrgEvent(event_id, body);
        check caller->respond(updated);
    }

    resource function delete events/[int event_id](http:Caller caller, http:Request req) returns error? {
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        string msg = check deleteOrgEvent(event_id);
        check caller->respond({message: msg});
    }

    // Handle volunteer application to events
    resource function post events/[int event_id]/apply(http:Caller caller, http:Request req) returns error? {
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        // Extract volunteer ID from token
        string authHeader = check req.getHeader("Authorization");
        string token = authHeader.substring(7);
        jwt:Payload payload = check jwt:validate(token, validatorConfig);
        anydata? uidJson = payload["user_id"];
        anydata? typeJson = payload["user_type"];

        if !(typeJson is string) || typeJson != "volunteer" {
            http:Response r = new;
            r.statusCode = http:STATUS_FORBIDDEN;
            r.setJsonPayload({"error": "Volunteer access required"});
            return caller->respond(r);
        }

        int vid;
        if uidJson is int {
            vid = uidJson;
        } else if uidJson is string {
            vid = check 'int:fromString(uidJson);
        } else {
            http:Response r = new;
            r.statusCode = http:STATUS_BAD_REQUEST;
            r.setJsonPayload({"error": "Invalid user_id"});
            return caller->respond(r);
        }

        EventApplication app = check createEventApplication(vid, event_id);
        return caller->respond(app);
    }

    resource function get donations/[int id](http:Caller caller, http:Request req) returns error? {
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        OrgDonation[] donations = check getOrgDonations(id);
        check caller->respond(donations);
    }

    // Donation Requests
    resource function post donation_requests(DonationRequest body, http:Caller caller, http:Request req) returns error? {
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        DonationRequest created = check createDonationRequest(body);
        check caller->respond(created);
    }

    resource function get donation_requests/org/[int organization_id](http:Caller caller, http:Request req) returns error? {
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        DonationRequest[] list = check listDonationRequests(organization_id);
        check caller->respond(list);
    }

    resource function get donation_requests/[int request_id](http:Caller caller, http:Request req) returns error? {
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        DonationRequest|error dr = getDonationRequest(request_id);
        if dr is DonationRequest {
            return caller->respond(dr);
        }
        http:Response r = new;
        r.statusCode = http:STATUS_NOT_FOUND;
        r.setJsonPayload({"error": (<error>dr).message()});
        return caller->respond(r);
    }

    resource function put donation_requests/[int request_id](DonationRequestUpdate body, http:Caller caller, http:Request req) returns error? {
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        DonationRequest|error dr = updateDonationRequest(request_id, body);
        if dr is DonationRequest {
            return caller->respond(dr);
        }
        error e = <error>dr;
        string msg = e.message();
        int status = http:STATUS_INTERNAL_SERVER_ERROR;
        if msg == "No fields updated or donation request not found" {
            status = http:STATUS_NOT_FOUND;
        }
        else if msg.indexOf("cannot be empty") >= 0 || msg.indexOf("must be >= 0") >= 0 || msg == "requestId required" {
            status = http:STATUS_BAD_REQUEST;
        }
        http:Response r = new;
        r.statusCode = status;
        r.setJsonPayload({"error": msg});
        return caller->respond(r);
    }

    resource function delete donation_requests/[int request_id](http:Caller caller, http:Request req) returns error? {
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        string|error res = deleteDonationRequest(request_id);
        if res is string {
            return caller->respond({message: res});
        }
        http:Response r = new;
        r.statusCode = http:STATUS_NOT_FOUND;
        r.setJsonPayload({"error": (<error>res).message()});
        return caller->respond(r);
    }

    // Feedback
    resource function post feedback(Feedback body, http:Caller caller, http:Request req) returns error? {
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        Feedback|error created = createFeedback(body);
        if created is Feedback {
            return caller->respond(created);
        }
        error e = <error>created;
        string msg = e.message();
        string reason = msg;
        int status = http:STATUS_INTERNAL_SERVER_ERROR;
        if msg == "event_id required" || msg == "volunteer_id required" ||
            msg == "organization_id required" || msg == "rating must be 1-5" {
            status = http:STATUS_BAD_REQUEST;
        } else if msg == "Event not found" || msg == "Volunteer not found" || msg == "Organization not found" {
            status = http:STATUS_NOT_FOUND;
        } else if msg == "Feedback already submitted for this event by volunteer" {
            status = http:STATUS_CONFLICT;
        }
        http:Response r = new;
        r.statusCode = status;
        r.setJsonPayload({"error": msg, "detail": reason});
        return caller->respond(r);
    }

    resource function get feedback/event/[int event_id](http:Caller caller, http:Request req) returns error? {
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        Feedback[] list = check listFeedbackByEvent(event_id);
        check caller->respond(list);
    }

    resource function get feedback/org/[int organization_id](http:Caller caller, http:Request req) returns error? {
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        Feedback[] list = check listFeedbackByOrg(organization_id);
        check caller->respond(list);
    }

    resource function get feedback/[int feedback_id](http:Caller caller, http:Request req) returns error? {
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        Feedback|error fb = getFeedback(feedback_id);
        if fb is Feedback {
            return caller->respond(fb);
        }
        http:Response r = new;
        r.statusCode = http:STATUS_NOT_FOUND;
        r.setJsonPayload({"error": (<error>fb).message()});
        return caller->respond(r);
    }

    resource function get feedback/volunteer/[int volunteer_id](http:Caller caller, http:Request req) returns error? {
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        Feedback[] list = check listFeedbackByVolunteer(volunteer_id);
        check caller->respond(list);
    }

    resource function put feedback/[int feedback_id](FeedbackUpdate upd, http:Caller caller, http:Request req) returns error? {
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        Feedback|error tmp = updateFeedback(feedback_id, upd);
        if tmp is Feedback {
            return caller->respond(tmp);
        }
        string msg = (<error>tmp).message();
        int status = http:STATUS_INTERNAL_SERVER_ERROR;
        if msg == "No fields updated or feedback not found" {
            status = http:STATUS_NOT_FOUND;
        }
        else if msg == "rating must be 1-5" {
            status = http:STATUS_BAD_REQUEST;
        }
        http:Response r = new;
        r.statusCode = status;
        r.setJsonPayload({"error": msg});
        return caller->respond(r);
    }

    resource function delete feedback/[int feedback_id](http:Caller caller, http:Request req) returns error? {
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        string|error del = deleteFeedback(feedback_id);
        if del is string {
            return caller->respond({message: del});
        }
        http:Response r = new;
        r.statusCode = http:STATUS_NOT_FOUND;
        r.setJsonPayload({"error": (<error>del).message()});
        return caller->respond(r);
    }

    // List applications for an event (organization view)
    resource function get events/[int event_id]/applications(http:Caller caller, http:Request req) returns error? {
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        int owningOrg = -1;
        {
            stream<record {|int oid;|}, sql:Error?> es = dbClient->query(`SELECT organization_id AS oid FROM events WHERE event_id = ${event_id}`);
            record {|record {|int oid;|} value;|}|sql:Error? en = es.next();
            sql:Error? ec = es.close();
            if ec is error {
                return ec;
            }
            if en is record {|record {|int oid;|} value;|} {
                owningOrg = en.value.oid;
            }
            else {
                http:Response r = new;
                r.statusCode = http:STATUS_NOT_FOUND;
                r.setJsonPayload({"error": "Event not found"});
                return caller->respond(r);
            }
        }
        string authHeader = "";
        {
            string|error h = req.getHeader("Authorization");
            if h is string {
                authHeader = h;
            }
        }
        string token = authHeader.substring(7);
        jwt:Payload|jwt:Error pv = jwt:validate(token, validatorConfig);
        if pv is jwt:Error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": pv.message()});
            return caller->respond(r);
        }
        jwt:Payload payload = <jwt:Payload>pv;
        anydata? typeJ = payload["user_type"];
        anydata? idJ = payload["user_id"];
        int callerOrg = -1;
        if idJ is int {
            callerOrg = idJ;
        } else if idJ is string {
            int|error p = 'int:fromString(idJ);
            if p is int {
                callerOrg = p;
            }
        }
        boolean allowed = false;
        if typeJ is string {
            if typeJ == "admin" {
                allowed = true;
            }
            else if typeJ == "organization" && callerOrg == owningOrg {
                allowed = true;
            }
        }
        if !allowed {
            http:Response r = new;
            r.statusCode = http:STATUS_FORBIDDEN;
            r.setJsonPayload({"error": "Organization ownership or admin required"});
            return caller->respond(r);
        }
        EventApplication[] list = check listEventApplicationsForEvent(event_id);
        return caller->respond(list);
    }

}

// Volunteer 

@http:ServiceConfig {
    cors: {
        allowOrigins: ["http://localhost:5173", "http://localhost:5174"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"]
    }
}

service /api/vol on mainListener {
    resource function get badges(http:Caller caller, http:Request req) returns error? {
        string authHeader = check req.getHeader("Authorization");
        if !authHeader.startsWith("Bearer ") {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": "Missing Bearer token"});
            return caller->respond(r);
        }
        string jwtToken = authHeader.substring(7);
        jwt:Payload|jwt:Error val = jwt:validate(jwtToken, validatorConfig);
        if val is jwt:Error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": val.message()});
            return caller->respond(r);
        }
        jwt:Payload payload = <jwt:Payload>val;
        anydata? uidJson = payload["user_id"];
        anydata? typeJson = payload["user_type"];
        if !(typeJson is string) || typeJson != "volunteer" || uidJson is () {
            http:Response r = new;
            r.statusCode = http:STATUS_FORBIDDEN;
            r.setJsonPayload({"error": "Volunteer access required"});
            return caller->respond(r);
        }
        int vid;
        if uidJson is int {
            vid = uidJson;
        }
        else if uidJson is string {
            int|error parsed = 'int:fromString(uidJson);
            if parsed is error {
                http:Response r = new;
                r.statusCode = http:STATUS_BAD_REQUEST;
                r.setJsonPayload({"error": "Invalid user_id claim"});
                return caller->respond(r);
            }
            vid = <int>parsed; 
        } else {
            http:Response r = new;
            r.statusCode = http:STATUS_BAD_REQUEST;
            r.setJsonPayload({"error": "Unsupported user_id claim type"});
            return caller->respond(r);
        }
        Badge[] list = check listBadgesForVolunteer(vid);
        return caller->respond(list);
    }

    resource function post events/[int event_id]/apply(http:Caller caller, http:Request req) returns error? {
        string authHeader = check req.getHeader("Authorization");
        if !authHeader.startsWith("Bearer ") {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": "Missing Bearer token"});
            return caller->respond(r);
        }
        string jwtToken = authHeader.substring(7);
        jwt:Payload|jwt:Error val = jwt:validate(jwtToken, validatorConfig);
        if val is jwt:Error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": val.message()});
            return caller->respond(r);
        }
        jwt:Payload payload = <jwt:Payload>val;
        anydata? uidJson = payload["user_id"];
        anydata? typeJson = payload["user_type"];
        if !(typeJson is string) || typeJson != "volunteer" || uidJson is () {
            http:Response r = new;
            r.statusCode = http:STATUS_FORBIDDEN;
            r.setJsonPayload({"error": "Volunteer access required"});
            return caller->respond(r);
        }
        int vid;
        if uidJson is int {
            vid = uidJson;
        }
        else if uidJson is string {
            int|error parsed = 'int:fromString(uidJson);
            if parsed is error {
                http:Response r = new;
                r.statusCode = http:STATUS_BAD_REQUEST;
                r.setJsonPayload({"error": "Invalid user_id claim"});
                return caller->respond(r);
            }
            vid = <int>parsed;
        } else {
            http:Response r = new;
            r.statusCode = http:STATUS_BAD_REQUEST;
            r.setJsonPayload({"error": "Unsupported user_id claim type"});
            return caller->respond(r);
        }
        stream<record {|boolean? is_active;|}, sql:Error?> vs = dbClient->query(`SELECT is_active FROM users WHERE user_id = ${vid}`);
        record {|record {|boolean? is_active;|} value;|}|sql:Error? vn = vs.next();
        sql:Error? vClose = vs.close();
        if vClose is error {
            return vClose;
        }
        if !(vn is record {|record {|boolean? is_active;|} value;|}) {
            http:Response r = new;
            r.statusCode = http:STATUS_NOT_FOUND;
            r.setJsonPayload({"error": "Volunteer not found"});
            return caller->respond(r);
        }
        boolean active = vn.value.is_active ?: false;
        if !active {
            http:Response r = new;
            r.statusCode = http:STATUS_FORBIDDEN;
            r.setJsonPayload({"error": "Volunteer inactive"});
            return caller->respond(r);
        }
        stream<record {|int eid;|}, sql:Error?> es = dbClient->query(`SELECT event_id as eid FROM events WHERE event_id = ${event_id}`);
        record {|record {|int eid;|} value;|}|sql:Error? en = es.next();
        sql:Error? eClose = es.close();
        if eClose is error {
            return eClose;
        }
        if !(en is record {|record {|int eid;|} value;|}) {
            http:Response r = new;
            r.statusCode = http:STATUS_NOT_FOUND;
            r.setJsonPayload({"error": "Event not found"});
            return caller->respond(r);
        }
        EventApplication|error app = createEventApplication(vid, event_id);
        if app is EventApplication {
            return caller->respond(app);
        }
        error e = <error>app;
        string msg = e.message();
        string detailed = msg;
        anydata d = <anydata>e.detail();
        if d is map<anydata> {
            anydata? dm = d["message"];
            if dm is string {
                detailed = dm;
            }
        }
        int sc = http:STATUS_INTERNAL_SERVER_ERROR;
        if detailed == "Event not found" || detailed == "Volunteer not found" || detailed == "Application not found" {
            sc = http:STATUS_NOT_FOUND;
        }
        http:Response r = new;
        r.statusCode = sc;
        r.setJsonPayload({"error": detailed});
        return caller->respond(r);
    }

    // List my event applications
    resource function get applications(http:Caller caller, http:Request req) returns error? {
        string authHeader = check req.getHeader("Authorization");
        if !authHeader.startsWith("Bearer ") {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": "Missing Bearer token"});
            return caller->respond(r);
        }
        jwt:Payload|jwt:Error val = jwt:validate(authHeader.substring(7), validatorConfig);
        if val is jwt:Error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": val.message()});
            return caller->respond(r);
        }
        jwt:Payload payload = <jwt:Payload>val;
        anydata? typeJ = payload["user_type"];
        anydata? idJ = payload["user_id"];
        int vid = -1;
        if idJ is int {
            vid = idJ;
        } else if idJ is string {
            int|error p = 'int:fromString(idJ);
            if p is int {
                vid = p;
            }
        }
        if !(typeJ is string) || typeJ != "volunteer" || vid < 0 {
            http:Response r = new;
            r.statusCode = http:STATUS_FORBIDDEN;
            r.setJsonPayload({"error": "Volunteer access required"});
            return caller->respond(r);
        }
        EventApplication[] list = check listEventApplicationsForVolunteer(vid);
        return caller->respond(list);
    }
    resource function delete events/[int event_id]/apply(http:Caller caller, http:Request req) returns error? {
        string authHeader = check req.getHeader("Authorization");
        if !authHeader.startsWith("Bearer ") {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": "Missing Bearer token"});
            return caller->respond(r);
        }
        jwt:Payload|jwt:Error val = jwt:validate(authHeader.substring(7), validatorConfig);
        if val is jwt:Error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": val.message()});
            return caller->respond(r);
        }
        jwt:Payload payload = <jwt:Payload>val;
        anydata? typeJ = payload["user_type"];
        anydata? idJ = payload["user_id"];
        int vid = -1;
        if idJ is int {
            vid = idJ;
        } else if idJ is string {
            int|error p = 'int:fromString(idJ);
            if p is int {
                vid = p;
            }
        }
        if !(typeJ is string) || typeJ != "volunteer" || vid < 0 {
            http:Response r = new;
            r.statusCode = http:STATUS_FORBIDDEN;
            r.setJsonPayload({"error": "Volunteer access required"});
            return caller->respond(r);
        }
        string|error res = deleteEventApplicationByVolunteer(vid, event_id);
        if res is string {
            return caller->respond({message: res});
        }
        http:Response r = new;
        r.statusCode = http:STATUS_NOT_FOUND;
        r.setJsonPayload({"error": (<error>res).message()});
        return caller->respond(r);
    }
}

@http:ServiceConfig {
    cors: {
        allowOrigins: ["http://localhost:5173", "http://localhost:5174"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"]
    }
}

service /api/volunteers on mainListener {
    resource function get [int id](http:Caller caller, http:Request req) returns error? {
        if id <= 0 {
            http:Response r = new;
            r.statusCode = http:STATUS_BAD_REQUEST;
            r.setJsonPayload({"error": "Invalid volunteer ID"});
            return caller->respond(r);
        }
        
        string authHeader = "";
        {
            string|error h = req.getHeader("Authorization");
            if h is string {
                authHeader = h;
            }
        }
        if !authHeader.startsWith("Bearer ") {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": "Missing Bearer token"});
            return caller->respond(r);
        }
        string token = authHeader.substring(7);
        jwt:Payload|jwt:Error pv = jwt:validate(token, validatorConfig);
        if pv is jwt:Error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": pv.message()});
            return caller->respond(r);
        }
        jwt:Payload payload = <jwt:Payload>pv;
        anydata? typeJ = payload["user_type"];
        anydata? idJ = payload["user_id"];
        int callerId = -1;
        if idJ is int {
            callerId = idJ;
        }
        else if idJ is string {
            int|error parsed = 'int:fromString(idJ);
            if parsed is int {
                callerId = parsed;
            }
        }
        if !(typeJ is string) || typeJ != "volunteer" || callerId != id {
            http:Response r = new;
            r.statusCode = http:STATUS_FORBIDDEN;
            r.setJsonPayload({"error": "Volunteer ownership required"});
            return caller->respond(r);
        }
        VolunteerProfile|error p = fetchVolunteerProfile(id);
        if p is VolunteerProfile {
            return caller->respond(p);
        }
        http:Response r = new;
        r.statusCode = http:STATUS_NOT_FOUND;
        r.setJsonPayload({"error": (<error>p).message()});
        return caller->respond(r);
    }
    resource function put [int id](VolunteerProfileUpdate upd, http:Caller caller, http:Request req) returns error? {
        string authHeader = "";
        {
            string|error h = req.getHeader("Authorization");
            if h is string {
                authHeader = h;
            }
        }
        if !authHeader.startsWith("Bearer ") {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": "Missing Bearer token"});
            return caller->respond(r);
        }
        string token = authHeader.substring(7);
        jwt:Payload|jwt:Error pv = jwt:validate(token, validatorConfig);
        if pv is jwt:Error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": pv.message()});
            return caller->respond(r);
        }
        jwt:Payload payload = <jwt:Payload>pv;
        anydata? typeJ = payload["user_type"];
        anydata? idJ = payload["user_id"];
        int callerId = -1;
        if idJ is int {
            callerId = idJ;
        } else if idJ is string {
            int|error parsed = 'int:fromString(idJ);
            if parsed is int {
                callerId = parsed;
            }
        }
        if !(typeJ is string) || typeJ != "volunteer" || callerId != id {
            http:Response r = new;
            r.statusCode = http:STATUS_FORBIDDEN;
            r.setJsonPayload({"error": "Volunteer ownership required"});
            return caller->respond(r);
        }

        VolunteerProfile|error p = upsertVolunteerProfile(id, upd);
        if p is VolunteerProfile {
            return caller->respond(p);
        }

        error e = <error>p;
        log:printError("Profile update failed", 'error = e);
        http:Response r = new;
        r.statusCode = e.message() == "Volunteer not found" ? http:STATUS_NOT_FOUND : http:STATUS_INTERNAL_SERVER_ERROR;
        r.setJsonPayload({"error": e.message(), "detail": e.toString()});
        return caller->respond(r);
    }

    // Volunteer badges
    resource function get [int id]/badges(http:Caller caller, http:Request req) returns error? {
        string authHeader = "";
        {
            string|error h = req.getHeader("Authorization");
            if h is string {
                authHeader = h;
            }
        }
        if !authHeader.startsWith("Bearer ") {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": "Missing Bearer token"});
            return caller->respond(r);
        }
        string token = authHeader.substring(7);
        jwt:Payload|jwt:Error pv = jwt:validate(token, validatorConfig);
        if pv is jwt:Error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": pv.message()});
            return caller->respond(r);
        }
        jwt:Payload payload = <jwt:Payload>pv;
        anydata? typeJ = payload["user_type"];
        anydata? idJ = payload["user_id"];
        int callerId = -1;
        if idJ is int {
            callerId = idJ;
        } else if idJ is string {
            int|error parsed = 'int:fromString(idJ);
            if parsed is int {
                callerId = parsed;
            }
        }
        if !(typeJ is string) || typeJ != "volunteer" || callerId != id {
            http:Response r = new;
            r.statusCode = http:STATUS_FORBIDDEN;
            r.setJsonPayload({"error": "Volunteer ownership required"});
            return caller->respond(r);
        }
        VolunteerProfile|error p = fetchVolunteerProfile(id);
        if p is error {
            http:Response r = new;
            r.statusCode = http:STATUS_NOT_FOUND;
            r.setJsonPayload({"error": (<error>p).message()});
            return caller->respond(r);
        }
        Badge[] list = check listBadgesForVolunteer(id);
        return caller->respond(list);
    }

    // Ranking
    resource function get top(http:Caller caller, http:Request req) returns error? {
        string byParam = req.getQueryParamValue("by") ?: "hours";
        if byParam != "hours" && byParam != "rating" {
            byParam = "hours";
        }
        VolunteerRanking[]|error list = computeTopVolunteers(byParam, 10);
        if list is VolunteerRanking[] {
            return caller->respond(list);
        }
        http:Response r = new;
        r.statusCode = http:STATUS_INTERNAL_SERVER_ERROR;
        r.setJsonPayload({"error": (<error>list).message()});
        return caller->respond(r);
    }
}

// Admin service (user_type must be admin)
function ensureAdmin(http:Request req) returns int|error {
    string authHeader = check req.getHeader("Authorization");
    if !authHeader.startsWith("Bearer ") {
        return error("Unauthorized", message = "Missing Bearer token");
    }
    string token = authHeader.substring(7);
    jwt:Payload|jwt:Error pv = jwt:validate(token, validatorConfig);
    if pv is jwt:Error {
        return error("Unauthorized", message = pv.message());
    }
    jwt:Payload payload = <jwt:Payload>pv;
    anydata? typeJ = payload["user_type"];
    anydata? idJ = payload["user_id"];
    if !(typeJ is string) || typeJ != "admin" || idJ is () {
        return error("Forbidden", message = "Admin access required");
    }
    if idJ is int {
        return idJ;
    }
    else if idJ is string {
        int|error parsed = 'int:fromString(idJ);
        if parsed is error {
            return error("BadToken", message = "Invalid user_id claim");
        }
        return <int>parsed;
    }
    return error("BadToken", message = "Unsupported user_id claim type");
}

// admin ser

@http:ServiceConfig {
    cors: {
        allowOrigins: ["http://localhost:5173", "http://localhost:5174"],
        allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"]
    }
}
service /api/admin on mainListener {
    resource function get users(http:Caller caller, http:Request req) returns error? {
        int|error adm = ensureAdmin(req);
        if adm is error {
            http:Response r = new;
            r.statusCode = http:STATUS_FORBIDDEN;
            r.setJsonPayload({"error": (<error>adm).message()});
            return caller->respond(r);
        }
        UserSummary[] list = check listAllUsers();
        return caller->respond(list);
    }

    resource function patch users/[int id]/status(UserStatusUpdate body, http:Caller caller, http:Request req) returns error? {
        int|error adm = ensureAdmin(req);
        if adm is error {
            http:Response r = new;
            r.statusCode = http:STATUS_FORBIDDEN;
            r.setJsonPayload({"error": (<error>adm).message()});
            return caller->respond(r);
        }
        string|error res = updateUserStatus(id, body.is_active);
        if res is string {
            return caller->respond({message: res});
        }
        http:Response r = new;
        r.statusCode = http:STATUS_NOT_FOUND;
        r.setJsonPayload({"error": (<error>res).message()});
        return caller->respond(r);
    }

    resource function delete users/[int id](http:Caller caller, http:Request req) returns error? {
        int|error adm = ensureAdmin(req);
        if adm is error {
            http:Response r = new;
            r.statusCode = http:STATUS_FORBIDDEN;
            r.setJsonPayload({"error": (<error>adm).message()});
            return caller->respond(r);
        }
        string|error res = deleteUserAccount(id);
        if res is string {
            return caller->respond({message: res});
        }
        http:Response r = new;
        r.statusCode = http:STATUS_NOT_FOUND;
        r.setJsonPayload({"error": (<error>res).message()});
        return caller->respond(r);
    }

    resource function get events/[int event_id]/contributions(http:Caller caller, http:Request req) returns error? {
        int|error adm = ensureAdmin(req);
        if adm is error {
            http:Response r = new;
            r.statusCode = http:STATUS_FORBIDDEN;
            r.setJsonPayload({"error": (<error>adm).message()});
            return caller->respond(r);
        }
        VolunteerContribution[] list = check listVolunteerContributionsForEvent(event_id);
        return caller->respond(list);
    }

    // Admin awarding badge 
        resource function post badges(BadgeCreate body, http:Caller caller, http:Request req) returns error? {
        int|error adm = ensureAdmin(req);
        if adm is error {
            http:Response r = new;
            r.statusCode = http:STATUS_FORBIDDEN;
            r.setJsonPayload({"error": (<error>adm).message()});
            return caller->respond(r);
        }
        int adminId = <int>adm;
        BadgeCreate payload = {volunteer_id: body.volunteer_id, badge_name: body.badge_name, badge_description: body.badge_description ?: (), awarded_by: adminId};
        Badge|error b = createBadge(payload);
        if b is Badge {
            return caller->respond(b);
        }
        error e = <error>b;
        string msg = e.message();
        int status = http:STATUS_BAD_REQUEST;
        if msg == "Volunteer not found" {
            status = http:STATUS_NOT_FOUND;
        }
        http:Response r = new;
        r.statusCode = status;
        r.setJsonPayload({"error": msg});
        return caller->respond(r);
    }

    // Recalculate and award performance badges automatically for a volunteer
    resource function post volunteers/[int volunteer_id]/performance_badges(http:Caller caller, http:Request req) returns error? {
        int|error adm = ensureAdmin(req);
        if adm is error {
            http:Response r = new;
            r.statusCode = http:STATUS_FORBIDDEN;
            r.setJsonPayload({"error": (<error>adm).message()});
            return caller->respond(r);
        }
        int adminId = <int>adm;
        //check the volunteer exists
        stream<record {|int vid;|}, sql:Error?> vs = dbClient->query(
        `SELECT user_id AS vid FROM users WHERE user_id = ${volunteer_id} AND user_type = 'volunteer'`
        );
        record {|record {|int vid;|} value;|}? vn = check vs.next();
        check vs.close();
        if !(vn is record {|record {|int vid;|} value;|}) {
            http:Response r = new;
            r.statusCode = http:STATUS_NOT_FOUND;
            r.setJsonPayload({"error": "Volunteer not found"});
            return caller->respond(r);
        }
        json payload = check req.getJsonPayload();
        if payload is map<json> {
            BadgeCreate b = {
                volunteer_id: volunteer_id,
                badge_name: <string>payload["badge_name"],
                badge_description: <string?>payload["badge_description"],
                awarded_by: adminId
            };

            Badge newBadge = check createBadge(b);
            return caller->respond(newBadge);
        } else {
            return error("InvalidPayload", message = "Request body must be a JSON object");
        }

    }

    // Update event application status (?status=approved|rejected|pending)
    resource function patch applications/[int application_id]/status(http:Caller caller, http:Request req) returns error? {
        int|error adm = ensureAdmin(req);
        if adm is error {
            http:Response r = new;
            r.statusCode = http:STATUS_FORBIDDEN;
            r.setJsonPayload({"error": (<error>adm).message()});
            return caller->respond(r);
        }
        string newStatus = req.getQueryParamValue("status") ?: "pending";
        EventApplication|error app = updateEventApplicationStatus(application_id, newStatus);
        if app is EventApplication {
            return caller->respond(app);
        }
        http:Response r = new;
        string msg = (<error>app).message();
        r.statusCode = msg == "Application not found" ? http:STATUS_NOT_FOUND : http:STATUS_BAD_REQUEST;
        r.setJsonPayload({"error": msg});
        return caller->respond(r);
    }
}



// Public Services
@http:ServiceConfig {
  cors: {
        allowOrigins: ["http://localhost:5173", "http://localhost:5174"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"]
    }
}
service /pub on mainListener {
    
    resource function options .(http:Caller caller, http:Request req) returns error? {
        http:Response response = new;
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.statusCode = http:STATUS_NO_CONTENT;
        return caller->respond(response);
    }

    // Get volunteer profile by ID (for orgs to view volunteer details)
    resource function get volunteers/[int volunteer_id]/profile(http:Caller caller, http:Request req) returns error? {
        if volunteer_id <= 0 {
            http:Response r = new;
            r.statusCode = http:STATUS_BAD_REQUEST;
            r.setJsonPayload({"error": "Invalid volunteer_id path parameter"});
            return caller->respond(r);
        }
        VolunteerProfile|error profile = fetchVolunteerProfile(volunteer_id);
        if profile is VolunteerProfile {
            return caller->respond(profile);
        }
        http:Response r = new;
        r.statusCode = http:STATUS_NOT_FOUND;
        r.setJsonPayload({"error": (<error>profile).message()});
        return caller->respond(r);
    }
    resource function get badges/[int badge_id](http:Caller caller, http:Request req) returns error? {
        Badge|error b = getBadge(badge_id);
        if b is Badge {
            return caller->respond(b);
        }
        http:Response r = new;
        r.statusCode = http:STATUS_NOT_FOUND;
        r.setJsonPayload({"error": (<error>b).message()});
        return caller->respond(r);
    }

    resource function get badges/volunteer/[int volunteer_id](http:Caller caller, http:Request req) returns error? {
        Badge[] list = check listBadgesForVolunteer(volunteer_id);
        return caller->respond(list);
    }

    // Public donation requests
    resource function get donation_requests/[int request_id](http:Caller caller, http:Request req) returns error? {
        DonationRequest|error dr = getDonationRequest(request_id);
        if dr is DonationRequest {
            return caller->respond(dr);
        }
        http:Response r = new;
        r.statusCode = http:STATUS_NOT_FOUND;
        r.setJsonPayload({"error": (<error>dr).message()});
        return caller->respond(r);
    }

    resource function get donation_requests/org/[int organization_id](http:Caller caller, http:Request req) returns error? {
        DonationRequest[] list = check listDonationRequests(organization_id);
        return caller->respond(list);
    }

    // Public donations list per organization
    resource function get donations/org/[int organization_id](http:Caller caller, http:Request req) returns error? {
        OrgDonation[] donations = check getOrgDonations(organization_id);
        return caller->respond(donations);
    }

    // get all donation requests
    resource function get donation_requests() returns DonationRequest[]|http:InternalServerError {
        DonationRequest[]|error result = getAllDonationRequests();
        if result is error {
            return http:INTERNAL_SERVER_ERROR;
        }
        return result;
    }

    // Public events
    resource function get events/org/[int organization_id](http:Caller caller, http:Request req) returns error? {
        OrgEvent[] events = check getOrgEvents(organization_id);
        return caller->respond(events);
    }

    // Public: Get all events
    resource function get events(http:Caller caller, http:Request req) returns error? {
        OrgEvent[] events = check getAllEvents();
        return caller->respond(events);
    }

    resource function get events/[int event_id](http:Caller caller, http:Request req) returns error? {
        OrgEvent|error ev = getEvent(event_id);
        if ev is OrgEvent {
            return caller->respond(ev);
        }
        http:Response r = new;
        r.statusCode = http:STATUS_NOT_FOUND;
        r.setJsonPayload({"error": (<error>ev).message()});
        return caller->respond(r);
    }

    // Public feedback for volunteers
    resource function get feedback/volunteer/[int volunteer_id](http:Caller caller, http:Request req) returns error? {
        Feedback[] list = check listFeedbackByVolunteer(volunteer_id);
        return caller->respond(list);
    }

    // Public organizations list
    resource function get organizations(http:Caller caller, http:Request req) returns error? {
        UserSummary[] allUsers = check listAllUsers();
        UserSummary[] orgs = allUsers.filter(function(UserSummary u) returns boolean {
            return u.user_type == "organization";
        });
        return caller->respond(orgs);
    }

    // Pub user data
    resource function get users/[int user_id](http:Caller caller, http:Request req) returns error? {
        UserSummary[] allUsers = check listAllUsers();
        UserSummary? user = ();
        foreach UserSummary u in allUsers {
            if u.user_id == user_id {
                user = u;
                break;
            }
        }
        if user is UserSummary {
            return caller->respond(user);
        }
        http:Response r = new;
        r.statusCode = http:STATUS_NOT_FOUND;
        r.setJsonPayload({"error": "User not found"});
        return caller->respond(r);
    }

    // Public event contributions
    resource function get events/[int event_id]/contributions(http:Caller caller, http:Request req) returns error? {
        Feedback[] feedbackList = check listFeedbackByEvent(event_id);

        return caller->respond(feedbackList);

    }
}

// Login and Register

service /api/auth on mainListener {
    resource function post register(User user, http:Caller caller) returns error? {
        string|error regResult = registerUser(user);
        if regResult is string {
            return caller->respond({message: regResult});
        }
        http:Response resp = new;
        resp.statusCode = http:STATUS_CONFLICT;
        resp.setJsonPayload({"error": regResult.message()});
        return caller->respond(resp);
    }

    resource function post login(LoginRequest creds, http:Caller caller) returns error? {
        map<anydata>|error loginResult = loginUser(creds);
        if loginResult is map<anydata> {
            loginResult["email"] = creds.email;
            return caller->respond(loginResult);
        }
        http:Response resp = new;
        resp.statusCode = http:STATUS_UNAUTHORIZED;
        resp.setJsonPayload({"error": loginResult.message()});
        return caller->respond(resp);
    }
}

// Static file server for uploaded images
service /uploads on mainListener {
    resource function get [string fileName](http:Caller caller) returns error? {
        string filePath = "./uploads/" + fileName;
        byte[]|io:Error fileContent = io:fileReadBytes(filePath);
        if fileContent is byte[] {
            http:Response response = new;
            response.setBinaryPayload(fileContent);
            response.setHeader("Content-Type", "image/jpeg");
            return caller->respond(response);
        }
        http:Response r = new;
        r.statusCode = http:STATUS_NOT_FOUND;
        return caller->respond(r);
    }
}



// Contact
@http:ServiceConfig {
    cors: {
        allowOrigins: ["http://localhost:5173", "http://localhost:5174"],
        allowMethods: ["GET", "POST", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"]
    }
}

service /api/contact on mainListener {
    resource function post message(ContactRequest req, http:Caller caller) returns error? {
        ContactMessage|error result = createContactMessage(req);
        if result is ContactMessage {
            return caller->respond({message: "Message sent successfully", contact_id: result.contact_id});
        }
        error e = <error>result;
        string msg = e.message();
        int status = http:STATUS_INTERNAL_SERVER_ERROR;
        if msg.indexOf("required") >= 0 {
            status = http:STATUS_BAD_REQUEST;
        }
        http:Response r = new;
        r.statusCode = status;
        r.setJsonPayload({"error": msg});
        return caller->respond(r);
    }

    resource function get messages(http:Caller caller, http:Request req) returns error? {
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        ContactMessage[] messages = check getAllContactMessages();
        return caller->respond(messages);
    }

    resource function post upload_photo(http:Request request, http:Caller caller) returns error? {
        var bodyParts = request.getBodyParts();
        if (bodyParts is mime:Entity[]) {
            foreach var part in bodyParts {
                if (part.getContentType().startsWith("image/")) {
                    byte[] imageBytes = check part.getByteArray();
                    string fileName = "profile_" + time:utcNow()[0].toString() + ".jpg";
                    string filePath = "./uploads/" + fileName;

                    check io:fileWriteBytes(filePath, imageBytes);
                    return caller->respond({"success": true, "photoUrl": "/uploads/" + fileName});
                }
            }
        }
        return caller->respond({"success": false, "message": "No image file found"});
    }
}


// chat application 
@http:ServiceConfig {
    cors: {
        allowOrigins: ["http://localhost:5173", "http://localhost:5174"],
        allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"]
    }
}
service /api/chat on mainListener {
    // Handle OPTIONS preflight requests
    resource function options .(http:Caller caller, http:Request req) returns error? {
        http:Response response = new;
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.statusCode = http:STATUS_NO_CONTENT;
        return caller->respond(response);
    }

    // Delete a chat message (only sender, within 15 minutes)
    resource function delete messages/[int id](http:Caller caller, http:Request req) returns error? {
        if id <= 0 {
            http:Response r = new;
            r.statusCode = http:STATUS_BAD_REQUEST;
            r.setJsonPayload({"error": "Invalid message id"});
            return caller->respond(r);
        }
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        string authHeader = check req.getHeader("Authorization");
        string token = authHeader.substring(7);
        jwt:Payload jwtPayload = check jwt:validate(token, validatorConfig);
        anydata? userIdJ = jwtPayload["user_id"];
        int userId = -1;
        if userIdJ is int { userId = userIdJ; }
        else if userIdJ is string {
            int|error parsed = 'int:fromString(userIdJ);
            if parsed is int { userId = parsed; }
        }
        // Fetch message info
        stream<record {|int user_id; string created_at;|}, sql:Error?> msgStream = dbClient->query(`SELECT user_id, created_at FROM event_chat_messages WHERE id = ${id}`);
        record {|record {|int user_id; string created_at;|} value;|}|sql:Error? msgRow = msgStream.next();
        check msgStream.close();
        if !(msgRow is record {|record {|int user_id; string created_at;|} value;|}) {
            http:Response r = new;
            r.statusCode = http:STATUS_NOT_FOUND;
            r.setJsonPayload({"error": "Message not found"});
            return caller->respond(r);
        }
        int senderId = msgRow.value.user_id;
        // Only sender can delete
        if senderId != userId {
            http:Response r = new;
            r.statusCode = http:STATUS_FORBIDDEN;
            r.setJsonPayload({"error": "You can only delete your own messages"});
            return caller->respond(r);
        }
        // Delete message
        sql:ExecutionResult|sql:Error result = dbClient->execute(`DELETE FROM event_chat_messages WHERE id = ${id}`);
        if result is sql:Error {
            http:Response r = new;
            r.statusCode = http:STATUS_INTERNAL_SERVER_ERROR;
            r.setJsonPayload({"error": result.message()});
            return caller->respond(r);
        }
        
        
        return caller->respond({success: true});

    }
   resource function get events/[int event_id]/messages/unread(http:Caller caller, http:Request req) returns error? {
        if event_id <= 0 {
            http:Response r = new;
            r.statusCode = http:STATUS_BAD_REQUEST;
            r.setJsonPayload({"error": "Invalid event_id"});
            return caller->respond(r);
        }
        
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }

        // Get volunteer_id from query param
        string? volunteerIdStr = req.getQueryParamValue("volunteer_id");
        if volunteerIdStr is () {
            http:Response r = new;
            r.statusCode = http:STATUS_BAD_REQUEST;
            r.setJsonPayload({"error": "Missing volunteer_id query parameter"});
            return caller->respond(r);
        }
        
        if volunteerIdStr == "null" || volunteerIdStr == "undefined" {
            http:Response r = new;
            r.statusCode = http:STATUS_BAD_REQUEST;
            r.setJsonPayload({"error": "Invalid volunteer_id: null or undefined"});
            return caller->respond(r);
        }
        
        int|error volunteerId = 'int:fromString(volunteerIdStr);
        if volunteerId is error || volunteerId <= 0 {
            http:Response r = new;
            r.statusCode = http:STATUS_BAD_REQUEST;
            r.setJsonPayload({"error": "Invalid volunteer_id"});
            return caller->respond(r);
        }

        // Query for unread messages for this volunteer in this event
        int unreadCount = 0;
        stream<record {|int cnt;|}, sql:Error?> res = dbClient->query(`
            SELECT COUNT(*) AS cnt 
            FROM event_chat_messages 
            WHERE event_id = ${event_id} 
              AND recipient_id = ${volunteerId} 
              AND is_read = 0`);
        record {|record {|int cnt;|} value;|}|sql:Error? row = res.next();
        if row is record {|record {|int cnt;|} value;|} {
            unreadCount = row.value.cnt;
        }
        check res.close();
        check caller->respond({unread: unreadCount});
        return;
    }

    resource function get events/[int event_id]/messages(http:Caller caller, http:Request req) returns error? {
        if event_id <= 0 {
            http:Response r = new;
            r.statusCode = http:STATUS_BAD_REQUEST;
            r.setJsonPayload({"error": "Invalid event_id"});
            return caller->respond(r);
        }
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        ChatMessage[] messages = check getChatMessages(event_id);
        return caller->respond(messages);
    }


    // Private chat between organization and specific volunteer
    resource function get events/[int event_id]/messages/volunteer/[int volunteer_id](http:Caller caller, http:Request req) returns error? {
        if event_id <= 0 || volunteer_id <= 0 {
            http:Response r = new;
            r.statusCode = http:STATUS_BAD_REQUEST;
            r.setJsonPayload({"error": "Invalid event_id or volunteer_id"});
            return caller->respond(r);
        }
        
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }
        
    // Verify caller is organization or the specific volunteer
        string authHeader = check req.getHeader("Authorization");
        string token = authHeader.substring(7);
        jwt:Payload jwtPayload = check jwt:validate(token, validatorConfig);
        anydata? userIdJ = jwtPayload["user_id"];
        anydata? userTypeJ = jwtPayload["user_type"];
        
        int userId = -1;
        if userIdJ is int {
            userId = userIdJ;
        } else if userIdJ is string {
            int|error parsed = 'int:fromString(userIdJ);
            if parsed is int {
                userId = parsed;
            }
        }
        
        string userType = "";
        if userTypeJ is string {
            userType = userTypeJ;
        }
        
        // Get organization ID for this event to verify access
        stream<record {|int org_id;|}, sql:Error?> orgStream = dbClient->query(`
            SELECT organization_id as org_id FROM events WHERE event_id = ${event_id}`);
        record {|record {|int org_id;|} value;|}|sql:Error? orgRow = orgStream.next();
        check orgStream.close();
        
        int eventOrgId = -1;
        if orgRow is record {|record {|int org_id;|} value;|} {
            eventOrgId = orgRow.value.org_id;
        }
        
        boolean hasAccess = false;
        if userType == "volunteer" && userId == volunteer_id {
            hasAccess = true;
        } else if userType == "organization" && userId == eventOrgId {
            hasAccess = true;
        }
        
        if !hasAccess {
            http:Response r = new;
            r.statusCode = http:STATUS_FORBIDDEN;
            r.setJsonPayload({"error": "Access denied - you can only view your own conversations"});
            return caller->respond(r);
        }
        
        ChatMessage[] messages = check getPrivateChatMessages(event_id, volunteer_id);
        return caller->respond(messages);
    }

    resource function post events/[int event_id]/messages/volunteer/[int volunteer_id](http:Caller caller, http:Request req) returns error? {
        
        if event_id <= 0 || volunteer_id <= 0 {
            http:Response r = new;
            r.statusCode = http:STATUS_BAD_REQUEST;
            r.setJsonPayload({"error": "Invalid event_id or volunteer_id"});
            return caller->respond(r);
        }
        
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }

        json payload = check req.getJsonPayload();
        string message = "";
        if payload is map<json> {
            json? msgVal = payload["message"];
            if msgVal is string {
                message = msgVal;
            }
        }
        
        string authHeader = check req.getHeader("Authorization");
        string token = authHeader.substring(7);
        jwt:Payload jwtPayload = check jwt:validate(token, validatorConfig);
        anydata? userIdJ = jwtPayload["user_id"];
        anydata? userTypeJ = jwtPayload["user_type"];
        
        int senderId = -1;
        if userIdJ is int {
            senderId = userIdJ;
        } else if userIdJ is string {
            int|error parsed = 'int:fromString(userIdJ);
            if parsed is int {
                senderId = parsed;
            }
        }
        
        string userType = "";
        if userTypeJ is string {
            userType = userTypeJ;
        }
        
        // Get organization ID for this event
        stream<record {|int org_id;|}, sql:Error?> orgStream = dbClient->query(`
            SELECT organization_id as org_id FROM events WHERE event_id = ${event_id}`);
        record {|record {|int org_id;|} value;|}|sql:Error? orgRow = orgStream.next();
        check orgStream.close();
        
        int eventOrgId = -1;
        if orgRow is record {|record {|int org_id;|} value;|} {
            eventOrgId = orgRow.value.org_id;
        }
        
        boolean hasAccess = false;
        int recipientId = -1;
        
        if userType == "volunteer" && senderId == volunteer_id {
          
            hasAccess = true;
            recipientId = eventOrgId;
        } else if userType == "organization" && senderId == eventOrgId {
            hasAccess = true;
            recipientId = volunteer_id;
        }
        
        if !hasAccess {
            http:Response r = new;
            r.statusCode = http:STATUS_FORBIDDEN;
            r.setJsonPayload({"error": "Access denied - you can only send messages in your own conversations"});
            return caller->respond(r);
        }
        
        check postPrivateChatMessage(event_id, senderId, recipientId, message);
        return caller->respond({success: true});
    }

    resource function post events/[int event_id]/messages(http:Caller caller, http:Request req) returns error? {
        error? vErr = validateAuth(req);
        if vErr is error {
            http:Response r = new;
            r.statusCode = http:STATUS_UNAUTHORIZED;
            r.setJsonPayload({"error": vErr.message()});
            return caller->respond(r);
        }

        json payload = check req.getJsonPayload();
        string message = "";
        if payload is map<json> {
            json? msgVal = payload["message"];
            if msgVal is string {
                message = msgVal;
            } else if msgVal is () {
                return error("Missing 'message' field in payload");
            } else {
                message = msgVal.toString();
            }
        } else {
            return error("Invalid payload format");
        }
        string authHeader = check req.getHeader("Authorization");
        string token = authHeader.substring(7);
        jwt:Payload jwtPayload = check jwt:validate(token, validatorConfig);
        anydata? userIdJ = jwtPayload["user_id"];
        int userId = -1;
        if userIdJ is int {
            userId = userIdJ;
        } else if userIdJ is string {
            int|error parsed = 'int:fromString(userIdJ);
            if parsed is int {
                userId = parsed;
            }
        }
        if userId < 0 {
            return error("Invalid user_id in JWT");
        }

        check postChatMessage(event_id, userId, message);
        return caller->respond({success: true});
    }
}

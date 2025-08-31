import ballerina/sql;

// Enhanced chat message record type with private messaging support
type ChatMessage record {
    int id;
    int event_id;
    int user_id;
    int? recipient_id; 
    string message;
    string sender_type;
    string? sender_name;
    string created_at;
};


function getVolunteerChatMessages(int eventId, int volunteerId) returns ChatMessage[]|error {
    ChatMessage[] messages = [];
    
    stream<record {|int org_id;|}, sql:Error?> orgStream = dbClient->query(`
        SELECT organization_id as org_id FROM events WHERE event_id = ${eventId}`);
    record {|record {|int org_id;|} value;|}|sql:Error? orgRow = orgStream.next();
    check orgStream.close();
    
    int organizationId = -1;
    if orgRow is record {|record {|int org_id;|} value;|} {
        organizationId = orgRow.value.org_id;
    } else {
        return error("Event not found");
    }
    
    
    stream<record {| 
        int id;
        int event_id;
        int user_id;
        int? recipient_id;
        string message;
        string sender_type;
        string? sender_name;
        string created_at;
    |}, sql:Error?> resultStream = dbClient->query(`
        SELECT 
            ecm.id, ecm.event_id, ecm.user_id, ecm.recipient_id, ecm.message, ecm.created_at,
            u.user_type as sender_type, u.name as sender_name
        FROM event_chat_messages ecm
        JOIN users u ON ecm.user_id = u.user_id
        WHERE ecm.event_id = ${eventId}
          AND (
            (ecm.user_id = ${volunteerId} AND ecm.recipient_id = ${organizationId})
            OR
            (ecm.user_id = ${organizationId} AND ecm.recipient_id = ${volunteerId})
          )
        ORDER BY ecm.created_at ASC`);

    error? e = resultStream.forEach(function(record {| 
        int id;
        int event_id;
        int user_id;
        int? recipient_id;
        string message;
        string sender_type;
        string? sender_name;
        string created_at;
    |} row) {
        ChatMessage msg = {
            id: row.id,
            event_id: row.event_id,
            user_id: row.user_id,
            recipient_id: row.recipient_id,
            message: row.message,
            sender_type: row.sender_type,
            sender_name: row.sender_name,
            created_at: row.created_at
        };
        messages.push(msg);
    });
    if e is error {
        return e;
    }
    
    return messages;
}
function getOrganizationChatMessages(int eventId) returns ChatMessage[]|error {
    ChatMessage[] messages = [];
    stream<record {|
        int id;
        int event_id;
        int user_id;
        string message;
        string sender_type;
        string? sender_name;
        string created_at;
    |}, sql:Error?> resultStream = dbClient->query(`
        SELECT 
            ecm.id, ecm.event_id, ecm.user_id, ecm.message, ecm.created_at,
            u.user_type as sender_type, u.name as sender_name
        FROM event_chat_messages ecm
        JOIN users u ON ecm.user_id = u.user_id
        WHERE ecm.event_id = ${eventId} AND (ecm.is_private = 0 OR ecm.is_private IS NULL)
        ORDER BY ecm.created_at ASC`);
    
    error? e = resultStream.forEach(function(record {|
        int id;
        int event_id;
        int user_id;
        string message;
        string sender_type;
        string? sender_name;
        string created_at;
    |} row) {
        ChatMessage msg = {
            id: row.id,
            event_id: row.event_id,
            user_id: row.user_id,
            recipient_id: (),
            message: row.message,
            sender_type: row.sender_type,
            sender_name: row.sender_name,
            created_at: row.created_at
        };
        messages.push(msg);
    });
    if e is error {
        return e;
    }
    return messages;
}

function postPrivateChatMessagesToVolunteer(int eventId, int senderId, int recipientId, string message) returns error? {
    _ = check dbClient->execute(`
        INSERT INTO event_chat_messages (event_id, user_id, recipient_id, message, is_private) 
        VALUES (${eventId}, ${senderId}, ${recipientId}, ${message}, 1)`);
}
function postPrivateChatMessagesToOrganization(int eventId, int userId, string message) returns error? {
    _ = check dbClient->execute(`
        INSERT INTO event_chat_messages (event_id, user_id, message, is_private) 
        VALUES (${eventId}, ${userId}, ${message}, 0)`);
}
import ballerina/sql;

type ContactMessage record {|
    int contact_id?;
    string name;
    string email;
    string subject;
    string message;
    string? created_at?;
    string? status?;
|};

type ContactRequest record {|
    string name;
    string email;
    string subject;
    string message;
|};

function createContactMessage(ContactRequest req) returns ContactMessage|error {
    string name = req.name.trim();
    if name == "" {
        return error("ValidationError", message = "name required");
    }

    string email = req.email.trim();
    if email == "" {
        return error("ValidationError", message = "email required");
    }

    string subject = req.subject.trim();
    if subject == "" {
        return error("ValidationError", message = "subject required");
    }

    string message = req.message.trim();
    if message == "" {
        return error("ValidationError", message = "message required");
    }

    sql:ExecutionResult|sql:Error r = dbClient->execute(`INSERT INTO contact_messages (name, email, subject, message) 
        VALUES (${name}, ${email}, ${subject}, ${message})`);

    if r is sql:Error {
        return error("DBError", message = "Database insert failed: " + r.message());
    }

    sql:ExecutionResult result = <sql:ExecutionResult>r;
    if result.affectedRowCount is int && result.affectedRowCount > 0 {
        int newId = <int>result.lastInsertId;
        return {
            contact_id: newId,
            name: name,
            email: email,
            subject: subject,
            message: message,
            created_at: (),
            status: "unread"
        };
    }
    return error("DBError", message = "Insert failed");
}

function getAllContactMessages() returns ContactMessage[]|error {
    ContactMessage[] messages = [];
    stream<ContactMessage, sql:Error?> rs = dbClient->query(`SELECT contact_id, name, email, subject, message, created_at, status FROM contact_messages ORDER BY created_at DESC`);
    while true {
        record {|ContactMessage value;|}|sql:Error? n = rs.next();
        if n is record {|ContactMessage value;|} {
            messages.push(n.value);
            continue;
        }
        break;
    }
    sql:Error? cerr = rs.close();
    if cerr is error {
        return cerr;
    }
    return messages;
}

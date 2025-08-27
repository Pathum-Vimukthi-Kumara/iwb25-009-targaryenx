import ballerina/crypto;
import ballerina/jwt;
import ballerina/regex;
import ballerina/sql;
import ballerinax/mysql;

configurable string JWT_SECRET = ?;

type DbConfig record {|
    string host;
    int port;
    string name;
    string user;
    string password;
    record {|
        int maxOpenConnections;
        int minIdleConnections;
        decimal maxConnectionLifeTime;
    |} connectionPool;
|};

sql:ConnectionPool poolOptions = {
    maxOpenConnections: dbConfig.connectionPool.maxOpenConnections,
    minIdleConnections: dbConfig.connectionPool.minIdleConnections,
    maxConnectionLifeTime: dbConfig.connectionPool.maxConnectionLifeTime
};

type User record {
    int user_id?;
    string email;
    string password;
    string user_type;
    string name;
    string phone?;
    boolean is_active?;
};

// Minimal payload for login to avoid requiring user_type/name
type LoginRequest record {
    string email;
    string password;
};

type UserIdRecord record {
    int user_id;
};

configurable DbConfig dbConfig = ?;
mysql:Client dbClient = check new (host = dbConfig.host, port = dbConfig.port, database = dbConfig.name,
    user = dbConfig.user, password = dbConfig.password, connectionPool = poolOptions,
    options = {ssl: {mode: mysql:SSL_DISABLED}}
);

function isValidPassword(string password) returns boolean {
    // Rule 1: Minimum length
    if password.length() < 8 {
        return false;
    }
    // Rule 2: At least one uppercase
    if !regex:matches(password, ".*[A-Z].*") {
        return false;
    }
    // Rule 3: At least one lowercase
    if !regex:matches(password, ".*[a-z].*") {
        return false;
    }
    // Rule 4: At least one digit
    if !regex:matches(password, ".*[0-9].*") {
        return false;
    }
    // Rule 5: At least one special character
    if !regex:matches(password, ".*[!@#$%^&*(),.?\":{}|<>].*") {
        return false;
    }
    return true;
}

function registerUser(User user) returns string|error {
    if user.user_type != "organization" && user.user_type != "volunteer" && user.user_type != "admin" {
        return error("Registration allowed only for organization, volunteer and admin users.");
    }

    if !isValidPassword(user.password) {
        return error("Password must be at least 8 characters long, include uppercase, lowercase, number, and special character.");
    }

    stream<UserIdRecord, sql:Error?> userStream = dbClient->query(`SELECT user_id FROM users WHERE email = ${user.email}`,
        UserIdRecord);
    record {|UserIdRecord value;|}|sql:Error? nextRec = userStream.next();
    sql:Error? closeErr = userStream.close();
    if closeErr is error {
        return closeErr;
    }
    if nextRec is record {|UserIdRecord value;|} {
        return error("Email already registered");
    }

    string hashedPassword = (crypto:hashSha256(user.password.toBytes())).toBase64();
    sql:ExecutionResult execResult = check dbClient->execute(`INSERT INTO users (email, password, user_type, name, phone, is_active)
        VALUES (${user.email}, ${hashedPassword}, ${user.user_type}, ${user.name}, ${user.phone}, ${user.is_active})`);
    if execResult.affectedRowCount is int && execResult.affectedRowCount > 0 {
        return "User registered successfully";
    }
    return error("User registration failed or no rows affected");
}

function loginUser(LoginRequest req) returns map<anydata>|error {
    stream<User, sql:Error?> userStream = dbClient->query(`SELECT user_id, password, user_type, name, phone, is_active FROM users
        WHERE email = ${req.email}`, User);
    record {|User value;|}|sql:Error? nextUser = userStream.next();
    sql:Error? closeErr2 = userStream.close();
    if closeErr2 is error {
        return closeErr2;
    }
    if !isValidPassword(req.password) {
        return error("Password must be at least 8 characters long, include uppercase, lowercase, number, and special character.");
    }
    if nextUser is record {|User value;|} {
        User dbUser = nextUser.value.clone();
        if dbUser.password != (crypto:hashSha256(req.password.toBytes())).toBase64() {
            return error("Invalid password");
        }
        string jwtToken = check generateJwt(dbUser);
        return {message: "Login successful", user_id: dbUser.user_id, user_type: dbUser.user_type, token: jwtToken};
    }
    return error("User not found");
}

function generateJwt(User user) returns string|error {
    jwt:IssuerConfig issuerConfig = {
        issuer: "VConnectAPI",
        username: user.email,
        audience: "VConnectClient",
        expTime: 3600,
        customClaims: {"user_id": user.user_id, "user_type": user.user_type, "name": user.name},
        signatureConfig: {algorithm: jwt:HS256, config: JWT_SECRET}
    };
    return check jwt:issue(issuerConfig);
}


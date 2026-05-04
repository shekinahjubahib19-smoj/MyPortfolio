<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json");

include 'db.php';

$data = json_decode(file_get_contents("php://input"));

if ($data) {
    $username = $data->username;
    $password = $data->password;

    // 1. Fetch the user by username
    $query = "SELECT id, username, password_hash, role, is_profile_complete FROM users WHERE username = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();

        // 2. Verify the password against the hashed version in DB
        if (password_verify($password, $user['password_hash'])) {
            echo json_encode([
                "success" => true,
                "user" => [
                    "id" => $user['id'],
                    "username" => $user['username'],
                    "role" => $user['role'],
                    "is_profile_complete" => (bool)$user['is_profile_complete']
                ]
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Invalid password."]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "User not found."]);
    }
}
?>
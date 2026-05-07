<?php
class UserModel {
    private $conn;
    public function __construct($conn) {
        $this->conn = $conn;
    }

    public function findByUsername($username) {
        $stmt = $this->conn->prepare('SELECT id, username, password_hash, role, is_profile_complete, must_change_password FROM users WHERE username = ? LIMIT 1');
        $stmt->bind_param('s', $username);
        $stmt->execute();
        $res = $stmt->get_result();
        return $res->fetch_assoc();
    }
}

?>

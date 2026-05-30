import React, { useEffect, useState, useRef } from "react";
import "../assets/css/set-up-profile.css";
import { useAuth } from "../context/AuthContext";
import { fetchUserProfile, saveTeacherProfile } from "../assets/js/profile";
import SetupProfileResult from "../assets/modals/setup-profile-result";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [username, setUsername] = useState(user?.username || "");
  const [teacherCode, setTeacherCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [maxHours, setMaxHours] = useState(8);
  const [savedProfile, setSavedProfile] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [resultError, setResultError] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [resultRedirect, setResultRedirect] = useState(false);
  const didLoad = useRef(false);

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    (async () => {
      try {
        const profile = await fetchUserProfile(user?.id);
        if (profile) {
          // support both teacher and admin profiles
          setTeacherCode(profile.teacher_code || profile.admin_code || "");
          setFirstName((profile.first_name || "").toUpperCase());
          setLastName((profile.last_name || "").toUpperCase());
          setMaxHours(profile.max_hours_per_day ?? 8);
          // store saved profile for display if user already has data
          setSavedProfile(profile);
          setHasProfile(true);
          setIsEditingExisting(false);
          // ensure username is current from auth context
          setUsername(user?.username || "");
        } else {
          setHasProfile(false);
          setIsEditingExisting(false);
        }
      } catch (err) {
        console.warn("Prefill users failed", err);
      }
    })();
  }, [user]);

  const toggleSubject = (id) => {
    // no-op now: subjects removed from teacher flow
    return;
  };

  const clearInputs = () => {
    setTeacherCode("");
    setFirstName("");
    setLastName("");
    setMaxHours(8);
    setMessage("");
  };

  const validateStep1 = () => {
    if (!teacherCode || !firstName || !lastName) {
      setMessage(
        `Please fill ${isAdmin ? "User Code" : "Teacher Code"}, First name and Last name.`,
      );
      return false;
    }
    if (!isAdmin && (!Number(maxHours) || Number(maxHours) <= 0)) {
      setMessage("Max hours per day must be greater than zero.");
      return false;
    }
    setMessage("");
    return true;
  };
  const goNext = () => {
    if (!validateStep1()) return false;
    return true;
  };

  const handleSave = async () => {
    if (!user) return;
    setWorking(true);
    setMessage("");
    try {
      const payload = {
        user_id: user.id,
        username: username,
        teacher_code: teacherCode,
        first_name: firstName,
        last_name: lastName,
        max_hours_per_day: isAdmin ? 8 : Number(maxHours) || 0,
        subjects: [],
      };
      const json = await saveTeacherProfile(payload);
      if (json && json.success) {
        setResultError(false);
        setResultMessage("Saved successfully.");
        setResultRedirect(false);
        setResultOpen(true);
        // extract saved profile depending on admin or teacher response
        if (isAdmin) {
          const adminProfile =
            json.profile && json.profile.admin ? json.profile.admin : null;
          if (adminProfile) {
            setSavedProfile(adminProfile);
            setHasProfile(true);
            setIsEditingExisting(false);
          }
        } else {
          // teacher response: json.profile.profile
          const teacherResp =
            json.profile && json.profile.profile ? json.profile.profile : null;
          if (teacherResp) {
            setSavedProfile(teacherResp);
            setHasProfile(true);
            setIsEditingExisting(false);
          }
        }
        // mark user as profile complete in client state
        if (typeof updateUser === "function")
          updateUser({ is_profile_complete: true, username: username });
      } else {
        setResultError(true);
        setResultMessage(json?.message || "Failed to save. Please try again.");
        setResultRedirect(false);
        setResultOpen(true);
      }
    } catch (err) {
      console.error(err);
      setResultError(true);
      setResultMessage("Failed to save. Please try again.");
      setResultRedirect(false);
      setResultOpen(true);
    } finally {
      setWorking(false);
    }
  };

  const prevProfileRef = useRef(null);
  const handleEdit = () => {
    if (savedProfile) prevProfileRef.current = savedProfile;
    setSavedProfile(null);
    setIsEditingExisting(true);
  };
  const handleCancelEdit = () => {
    if (prevProfileRef.current) {
      setSavedProfile(prevProfileRef.current);
      prevProfileRef.current = null;
    }
    setIsEditingExisting(false);
  };

  const handleResultOk = () => {
    setResultOpen(false);
    // keep user on profile page and show saved credentials if available
    if (savedProfile) {
      // no-op, saved profile already rendered
    }
  };

  return (
    <div className="setup-root">
      <SetupProfileResult
        isOpen={resultOpen}
        isError={resultError}
        message={resultMessage}
        onOk={handleResultOk}
      />
      <header
        className="setup-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1>Profile</h1>
          <p className="setup-sub">
            {isAdmin
              ? "Complete your admin profile before using the system"
              : "Complete your teacher profile before using the system"}
          </p>
        </div>
      </header>

      <div className="setup-list">
        <div style={{ padding: "0 0rem", maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{ display: "flex", flexDirection: "column", minHeight: 520 }}
          >
            {/* single-step profile form for teachers and admins (hidden when savedProfile exists) */}
            {!savedProfile && (
              <>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-start",
                    paddingTop: "3rem",
                  }}
                >
                  <form
                    onSubmit={(e) => e.preventDefault()}
                    className={isAdmin ? "setup-admin-form" : ""}
                    style={{ width: 560, marginLeft: "-1rem" }}
                  >
                    <div style={{ marginTop: 8 }}>
                      <div className="setup-section">
                        <label>Username</label>
                        <input
                          className="setup-input"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="e.g., jdoe"
                        />
                      </div>
                      <div className="setup-section">
                        <label>{isAdmin ? "User Code" : "Teacher Code"}</label>
                        <input
                          className={`setup-input${isEditingExisting ? " no-focus" : ""}`}
                          value={teacherCode}
                          onChange={(e) => setTeacherCode(e.target.value)}
                          readOnly={isEditingExisting}
                          placeholder="e.g., 2026001"
                        />
                      </div>

                      <div className="setup-section">
                        <label>First name</label>
                        <input
                          className="setup-input"
                          value={firstName}
                          onChange={(e) =>
                            setFirstName(e.target.value.toUpperCase())
                          }
                          placeholder="e.g., John"
                        />
                      </div>

                      <div className="setup-section">
                        <label>Last name</label>
                        <input
                          className="setup-input"
                          value={lastName}
                          onChange={(e) =>
                            setLastName(e.target.value.toUpperCase())
                          }
                          placeholder="e.g., Doe"
                        />
                      </div>

                      {!isAdmin && (
                        <div className="setup-section">
                          <label>Max hours per day</label>
                          <input
                            type="number"
                            className="setup-input"
                            value={maxHours}
                            onChange={(e) => setMaxHours(e.target.value)}
                            placeholder="e.g., 8"
                          />
                        </div>
                      )}
                    </div>
                  </form>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "0.5rem",
                    marginTop: "0.5rem",
                  }}
                >
                  <>
                    <button
                      className="btn secondary"
                      type="button"
                      onClick={clearInputs}
                    >
                      Clear
                    </button>
                    <button
                      className="btn"
                      type="button"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn primary"
                      type="button"
                      onClick={handleSave}
                      disabled={working}
                    >
                      {working ? "Saving…" : "Save"}
                    </button>
                  </>
                </div>
              </>
            )}
            {message && (
              <p
                style={{
                  textAlign: "center",
                  color: message.startsWith("Profile saved")
                    ? "#47d147"
                    : "#ff4d4d",
                }}
              >
                {message}
              </p>
            )}

            {/* Display profile as read-only form when present; single Edit button */}
            {savedProfile && (
              <>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-start",
                    paddingTop: "3rem",
                  }}
                >
                  <form
                    className={isAdmin ? "setup-admin-form" : ""}
                    style={{ width: 560, marginLeft: "-1rem" }}
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <div style={{ marginTop: 8 }}>
                      <div className="setup-section">
                        <label>Username</label>
                        <input
                          className="setup-input"
                          value={user?.username || ""}
                          readOnly
                        />
                      </div>
                      <div className="setup-section">
                        <label>{isAdmin ? "User Code" : "Teacher Code"}</label>
                        <input
                          className="setup-input"
                          value={
                            savedProfile.teacher_code ||
                            savedProfile.admin_code ||
                            ""
                          }
                          readOnly
                        />
                      </div>
                      <div className="setup-section">
                        <label>First name</label>
                        <input
                          className="setup-input"
                          value={(savedProfile.first_name || "").toUpperCase()}
                          readOnly
                        />
                      </div>
                      <div className="setup-section">
                        <label>Last name</label>
                        <input
                          className="setup-input"
                          value={(savedProfile.last_name || "").toUpperCase()}
                          readOnly
                        />
                      </div>
                      {!isAdmin && (
                        <div className="setup-section">
                          <label>Max hours per day</label>
                          <input
                            type="number"
                            className="setup-input"
                            value={savedProfile.max_hours_per_day ?? ""}
                            readOnly
                          />
                        </div>
                      )}
                    </div>
                  </form>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "0.5rem",
                    marginTop: "0.5rem",
                  }}
                >
                  <button
                    className="btn primary"
                    type="button"
                    onClick={handleEdit}
                  >
                    Edit
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

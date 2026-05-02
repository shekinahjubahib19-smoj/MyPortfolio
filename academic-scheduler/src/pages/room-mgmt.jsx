import React from 'react';
import '../assets/css/room-mgmt.css';

const RoomMgmt = () => {
  const rooms = [
    { name: 'Room 101', capacity: 30 },
    { name: 'Lab A', capacity: 20 },
    { name: 'Auditorium', capacity: 120 },
  ];

  return (
    <div className="rm-root">
      <header className="rm-header">
        <h1>Room Management</h1>
        <p className="rm-sub">Manage room capacities and booking (mock)</p>
      </header>

      <div className="rm-list">
        {rooms.map((r) => (
          <div className="rm-card" key={r.name}>
            <div className="rm-name">{r.name}</div>
            <div className="rm-cap">Capacity: {r.capacity}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomMgmt;

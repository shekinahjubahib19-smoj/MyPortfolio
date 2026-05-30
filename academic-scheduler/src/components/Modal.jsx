import React, { useEffect } from "react";
import { createPortal } from "react-dom";

const ensureRoot = () => {
  let root = document.getElementById("modal-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "modal-root";
    document.body.appendChild(root);
  }
  return root;
};

const Modal = ({ children, onClose, overlayStyle = {}, dialogStyle = {} }) => {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose && onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const root = ensureRoot();

  const overlayDefault = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
  };

  const dialogDefault = {
    background: "#0b0b0b",
    padding: 20,
    borderRadius: 8,
    width: "80%",
    maxHeight: "80%",
    overflow: "auto",
    color: "#fff",
  };

  return createPortal(
    <div
      style={{ ...overlayDefault, ...overlayStyle }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose && onClose();
      }}
    >
      <div style={{ ...dialogDefault, ...dialogStyle }}>{children}</div>
    </div>,
    root,
  );
};

export default Modal;

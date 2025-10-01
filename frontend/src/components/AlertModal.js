import { Modal, Button } from "react-bootstrap";

function AlertModal({ show, onHide, title, message, type = "info", onConfirm }) {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <i className="bi bi-check-circle-fill text-success me-2" style={{ fontSize: "1.5rem" }}></i>;
      case "error":
        return <i className="bi bi-x-circle-fill text-danger me-2" style={{ fontSize: "1.5rem" }}></i>;
      case "warning":
        return <i className="bi bi-exclamation-triangle-fill text-warning me-2" style={{ fontSize: "1.5rem" }}></i>;
      default:
        return <i className="bi bi-info-circle-fill text-primary me-2" style={{ fontSize: "1.5rem" }}></i>;
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          {getIcon()} {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        {onConfirm ? (
          <>
            <Button variant="secondary" onClick={onHide}>Cancel</Button>
            <Button variant="danger" onClick={() => { onConfirm(); onHide(); }}>Yes, Remove</Button>
          </>
        ) : (
          <Button variant="primary" onClick={onHide}>OK</Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}

export default AlertModal;

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
        <Modal.Title className="d-flex align-items-center justify-centent-center flex-wrap" style={{wordBreak:'break-word'}}>
          {getIcon()} {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        {onConfirm ? (
          <div className="d-flex justify-content-center align-items-center flex-wrap gap-1 w-100">
            <Button variant="danger" className="w-100" onClick={() => { onConfirm(); onHide(); }}>Yes</Button>
            <Button variant="secondary" className="w-100" onClick={onHide}>Close</Button>
          </div>
        ) : (
          <Button variant="primary" className="w-100" onClick={onHide}>OK</Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}

export default AlertModal;
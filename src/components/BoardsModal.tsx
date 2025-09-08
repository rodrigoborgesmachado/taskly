import Modal from './Modal';

interface Props {
  open: boolean;
  boards: FileSystemDirectoryHandle[];
  onSelect: (h: FileSystemDirectoryHandle) => void;
  onClose: () => void;
}

export default function BoardsModal({ open, boards, onSelect, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ display: 'grid', gap: 12 }}>
        <h3 style={{ margin: 0 }}>Boards</h3>
        {boards.length === 0 && <div>Nenhum board salvo</div>}
        {boards.length > 0 && (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
            {boards.map((h, idx) => (
              <li key={idx}>
                <button
                  onClick={() => onSelect(h)}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 12px' }}
                >
                  {(h as any).name ?? `Board ${idx + 1}`}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

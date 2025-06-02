export {};

declare global {
  interface Window {
    editRoom: (id: number) => void;
    viewRoom: (id: number) => void;
    deleteRoom: (id: number) => void;
  }
}

export type VideonPlayerProps = {
    videoTrackingId: string;
    autoPlay?: boolean;
    playsInline?: boolean;
    onReady?: () => void;
    onError?: () => void;
}

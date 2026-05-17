import ball from "@/shared/assets/Soccerball.svg.png"

type LoaderProps = {
  fullScreen?: boolean;
};

const Loader = ({ fullScreen = false }: LoaderProps) => {
  return (
    <div
      className={
        fullScreen
          ? "fixed inset-0 grid place-items-center bg-black/35 backdrop-blur-[1px]"
          : "grid place-items-center py-8"
      }
      role="status"
      aria-live="polite"
      aria-label="Загрузка"
    >
      <img
        src={ball}
        alt=""
        className="h-20 w-20 animate-spin [animation-duration:1.7s] will-change-transform"
      />
    </div>
  );
};

export default Loader;
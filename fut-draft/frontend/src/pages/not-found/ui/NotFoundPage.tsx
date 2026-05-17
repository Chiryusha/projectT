import { Link } from "react-router-dom"
import bg404 from "../assets/not-found-bg.jpg"

export const NotFoundPage = () => {
    return(
        <main
      className="relative min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bg404})` }}
    >
      <div className="absolute inset-x-0 bottom-16 flex justify-center">
        <Link
          to="/"
          className="rounded-full bg-emerald-500 px-10 py-5 text-base font-semibold text-white shadow-lg transition hover:bg-emerald-400"
        >
          На главную
        </Link>
      </div>
    </main>
    )
}

export default NotFoundPage
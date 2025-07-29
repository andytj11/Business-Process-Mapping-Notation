
import 'bootstrap/dist/css/bootstrap.min.css';
import NavBar from "@/components/NavBar";



export default function EventsLayout (
    {children,}: {children: React.ReactNode}
) {
    return (
        <div className="page-container bg-gray-50 min-h-screen">
            <NavBar/>
            {children}
        </div>
    )
}
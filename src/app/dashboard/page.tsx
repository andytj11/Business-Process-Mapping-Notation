'use client';
import 'bootstrap/dist/css/bootstrap.min.css';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from "@/components/UserContext";
import { useEffect } from 'react';


export default function Dashboard() {

    const user = useUser()
    const router = useRouter()

    useEffect(() => {
        if (user) {
            if (user.role === 'ADMIN') {
                router.replace('/dashboard/admin')
            }
            else router.replace('/dashboard/user')
        }
    }, [user, router])


    return <div>Loading...</div>
}
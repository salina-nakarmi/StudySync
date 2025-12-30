import { useAuth, useUser } from "@clerk/clerk-react"

export const useApi = () => {
    const { getToken } = useAuth()
    const { user } = useUser()

    const makeRequest = async (endpoint, options = {}) => {
        const token = await getToken()

        //User data headers
        const userHeaders = {}
        if (user) {
            userHeaders['X-User-Email'] = user.primaryEmailAddress?.emailAddress || ''
            userHeaders['X-User-First-Name'] = user.firstName || ''
            userHeaders['X-User-Last-Name'] = user.lastName || ''
            userHeaders['X-User-Username']  = user.username || ''
        }
        
        const response = await fetch(`http://localhost:8000/api/${endpoint}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                ...userHeaders, // Add user data headers
                ...options.headers, // Merge custom headers AFTER defaults
            }
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => null)
            if (response.status === 429) {
                throw new Error("Daily quota exceeded")
            }
            throw new Error(errorData?.detail || "An error occurred")
        }

        return response.json()
    }

    return { makeRequest }
}
import { createContext, useReducer, useEffect } from 'react';

export const AuthContext = createContext();

export const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN':
            return { user: action.payload, isLoading: false }
        case 'LOGOUT':
            return { user: null, isLoading: false }
        case 'AUTH_IS_READY':
            return { user: action.payload, isLoading: false }
        default:
            return state
    }
}


export const AuthContextProvider = ({ children }) => {
const [state, dispatch] = useReducer(authReducer , {
    user: null,
    isLoading: true
})

useEffect(() => {
    const validateStoredUser = async () => {
        const raw = localStorage.getItem('user')
        if (!raw) {
            dispatch({ type: 'AUTH_IS_READY', payload: null })
            return
        }
        let user = null
        try {
            user = JSON.parse(raw)
        } catch (err) {
            console.error('Failed to parse stored user:', err)
            localStorage.removeItem('user')
            dispatch({ type: 'AUTH_IS_READY', payload: null })
            return
        }

        const token = user.token
        if (!token) {
            console.log('No token found in stored user')
            localStorage.removeItem('user')
            dispatch({ type: 'AUTH_IS_READY', payload: null })
            return
        }

        try {
            const res = await fetch('http://localhost:4000/api/user/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const fresh = await res.json()
                console.log('User validated successfully:', fresh)
                // keep the client user in sync with server response
                localStorage.setItem('user', JSON.stringify(fresh))
                dispatch({ type: 'AUTH_IS_READY', payload: fresh })
            } else {
                console.log('Token validation failed:', res.status)
                localStorage.removeItem('user')
                dispatch({ type: 'AUTH_IS_READY', payload: null })
            }
        } catch (err) {
            console.error('Error validating token:', err)
            // Don't logout on network errors - keep user logged in
            dispatch({ type: 'AUTH_IS_READY', payload: user })
        }
    }

    validateStoredUser()
}, [])

useEffect(() => {
    const onLogout = () => {
        dispatch({ type: 'LOGOUT' })
        try { window.location.href = '/login' } catch (e) { /* ignore */ }
    }

    window.addEventListener('app-logout', onLogout)
    return () => window.removeEventListener('app-logout', onLogout)
}, [])

console.log('AuthContext state:', state)
    return (
        <AuthContext.Provider value={{ ...state, dispatch }}>
            { children }
        </AuthContext.Provider>
    )
}
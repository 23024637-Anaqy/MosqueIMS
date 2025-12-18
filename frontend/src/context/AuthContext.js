import { createContext, useReducer, useEffect } from 'react';

export const AuthContext = createContext();

export const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN':
            return { user: action.payload }
        case 'LOGOUT':
            return { user: null }
        default:
            return state
    }
}


export const AuthContextProvider = ({ children }) => {
const [state, dispatch] = useReducer(authReducer , {
    user: null
})

useEffect(() => {
    const validateStoredUser = async () => {
        const raw = localStorage.getItem('user')
        if (!raw) return
        let user = null
        try {
            user = JSON.parse(raw)
        } catch (err) {
            localStorage.removeItem('user')
            dispatch({ type: 'LOGOUT' })
            return
        }

        const token = user.token || user.id || user._id
        if (!token) {
            localStorage.removeItem('user')
            dispatch({ type: 'LOGOUT' })
            return
        }

        try {
            const res = await fetch('/api/user/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const fresh = await res.json()
                // keep the client user in sync with server response
                localStorage.setItem('user', JSON.stringify(fresh))
                dispatch({ type: 'LOGIN', payload: fresh })
            } else {
                localStorage.removeItem('user')
                dispatch({ type: 'LOGOUT' })
            }
        } catch (err) {
            localStorage.removeItem('user')
            dispatch({ type: 'LOGOUT' })
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
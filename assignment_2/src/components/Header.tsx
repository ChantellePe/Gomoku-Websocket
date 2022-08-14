import { Link, useNavigate, useLocation } from 'react-router-dom'
import style from './Header.module.css'
import buttonStyle from './Button.module.css'
import '../index.css'
import { useContext } from 'react'
import { UserContext } from '../context'


function Header() {
    const navigate = useNavigate()
    const { user } = useContext(UserContext)
    const location = useLocation()

    const getActions = () => {
        if (user) {
            return (<>
                <button className={buttonStyle.button} onClick={() => navigate('games')}>Previous Games</button>
            </>)
        } else {
            return location.pathname !== '/login' ? (
                <button className={buttonStyle.button} onClick={() => navigate('login')}>Log In</button>
            ) : <button className={buttonStyle.button}>Sign Up</button>
        }
    }

    return (
        <header>
            <div className={style.container}>
                <span className={style.author}>Chantelle Perreau presents...</span>
                <Link to="/" className={style.title}>
                    Gomoku
                </Link>
                {getActions()}
            </div>
        </header >
    )
}

export default Header
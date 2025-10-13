import { Link, useLocation } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import styled from 'styled-components'
import { motion } from 'framer-motion'

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem 2rem;
`

const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
`

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  text-decoration: none;
  background: linear-gradient(45deg, #fff, #e0e0e0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
`

const NavLink = styled(Link)<{ $active: boolean }>`
  color: ${props => props.$active ? '#fff' : 'rgba(255, 255, 255, 0.7)'};
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
  position: relative;
  
  &:hover {
    color: #fff;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(45deg, #667eea, #764ba2);
    transform: scaleX(${props => props.$active ? 1 : 0});
    transition: transform 0.3s ease;
  }
`

export default function Header() {
  const location = useLocation()

  return (
    <HeaderContainer>
      <Nav>
        <Logo to="/">Ethereum Game</Logo>
        
        <NavLinks>
          <NavLink to="/table" $active={location.pathname === '/table'}>
            Game
          </NavLink>
          <NavLink to="/marketplace" $active={location.pathname === '/marketplace'}>
            How to play?
          </NavLink>
          <ConnectButton />
        </NavLinks>
      </Nav>
    </HeaderContainer>
  )
}



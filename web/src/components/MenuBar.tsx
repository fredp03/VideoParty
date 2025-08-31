import { useEffect, useRef } from 'react'
import { animate, stagger } from 'animejs'
import movieIcon from '../assets/movie-icon.svg'
import './MenuBar.css'

interface MenuBarProps {
  onChatToggle: () => void
  isChatVisible: boolean
  onMediaToggle: () => void
  isMediaVisible: boolean
}

const MenuBar = ({ onChatToggle, isChatVisible, onMediaToggle, isMediaVisible }: MenuBarProps) => {
  const menuBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (menuBarRef.current) {
      const buttons = menuBarRef.current.querySelectorAll('button')
      animate(buttons, {
        opacity: [0, 1],
        translateY: [-8, 0],
        easing: 'easeOutQuad',
        delay: stagger(80)
      })
    }
  }, [])

  return (
    <div className="menu-bar" ref={menuBarRef}>
      <div className="left-side">
        <button className="home-button">
          <svg className="home-icon" width="47" height="45" viewBox="0 0 47 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g opacity="0.74" filter="url(#filter0_ddiiii_1_19104)">
              <rect x="3" y="3" width="41" height="39" rx="5" fill="#484848" fillOpacity="0.82"/>
              <path d="M14 23.0237H13H14ZM14 30.5439H15H14ZM31.5385 32V31V32ZM15.4615 32V33H15.4615L15.4615 32ZM33 23.0238H32H33ZM33 30.5439H34H33ZM32.2266 21.0504L32.9608 20.3715L32.2266 21.0504ZM25.6497 13.9389L24.9155 14.6178V14.6178L25.6497 13.9389ZM21.3503 13.9389L22.0845 14.6178V14.6178L21.3503 13.9389ZM14.7734 21.0504L14.0392 20.3714H14.0392L14.7734 21.0504ZM20.5769 24.7194H21.5769H20.5769ZM20.5769 31.2719H19.5769H20.5769ZM25.6923 32V31V32ZM21.3077 32V33V32ZM26.4231 24.7195H27.4231H26.4231ZM26.4231 31.2719H25.4231H26.4231ZM25.6923 23.9914L25.6923 22.9914L25.6923 23.9914ZM21.3077 23.9914L21.3077 24.9914H21.3077L21.3077 23.9914ZM14 23.0237H13L13 30.5439H14H15L15 23.0237H14ZM31.5385 32V31L15.4615 31L15.4615 32L15.4615 33L31.5385 33V32ZM33 23.0238H32V30.5439H33H34V23.0238H33ZM32.2266 21.0504L32.9608 20.3715L26.3839 13.2599L25.6497 13.9389L24.9155 14.6178L31.4925 21.7294L32.2266 21.0504ZM21.3503 13.9389L20.6161 13.2599L14.0392 20.3714L14.7734 21.0504L15.5075 21.7294L22.0845 14.6178L21.3503 13.9389ZM25.6497 13.9389L26.3839 13.2599C24.8303 11.58 22.1697 11.58 20.6161 13.2599L21.3503 13.9389L22.0845 14.6178C22.8463 13.7941 24.1537 13.7941 24.9155 14.6178L25.6497 13.9389ZM33 23.0238H34C34 22.0404 33.6287 21.0936 32.9608 20.3715L32.2266 21.0504L31.4925 21.7294C31.8192 22.0827 32 22.5448 32 23.0238H33ZM14 23.0237H15C15 22.5447 15.1808 22.0826 15.5075 21.7294L14.7734 21.0504L14.0392 20.3714C13.3713 21.0936 13 22.0404 13 23.0237H14ZM14 30.5439H13C13 31.9039 14.1056 33 15.4615 33V32V31C15.2031 31 15 30.7923 15 30.5439H14ZM31.5385 32V33C32.8944 33 34 31.9039 34 30.5439H33H32C32 30.7923 31.7969 31 31.5385 31V32ZM20.5769 24.7194H19.5769L19.5769 31.2719H20.5769H21.5769L21.5769 24.7194H20.5769ZM25.6923 32V31H21.3077V32V33H25.6923V32ZM26.4231 24.7195H25.4231L25.4231 31.2719H26.4231H27.4231L27.4231 24.7195H26.4231ZM25.6923 23.9914L25.6923 22.9914L21.3077 22.9914L21.3077 23.9914L21.3077 24.9914L25.6923 24.9914L25.6923 23.9914ZM26.4231 24.7195H27.4231C27.4231 23.7616 26.6447 22.9914 25.6923 22.9914L25.6923 23.9914L25.6923 24.9914C25.5471 24.9914 25.4231 24.8732 25.4231 24.7195H26.4231ZM20.5769 24.7194H21.5769C21.5769 24.8731 21.4529 24.9914 21.3077 24.9914L21.3077 23.9914L21.3077 22.9914C20.3553 22.9914 19.5769 23.7616 19.5769 24.7194H20.5769ZM20.5769 31.2719H19.5769C19.5769 32.2298 20.3553 33 21.3077 33V32V31C21.4529 31 21.5769 31.1182 21.5769 31.2719H20.5769ZM25.6923 32V33C26.6447 33 27.4231 32.2298 27.4231 31.2719H26.4231H25.4231C25.4231 31.1182 25.5471 31 25.6923 31V32Z" fill="#CECECE"/>
            </g>
            <defs>
              <filter id="filter0_ddiiii_1_19104" x="0" y="0" width="47" height="45" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                <feOffset dx="-1" dy="-1"/>
                <feGaussianBlur stdDeviation="1"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0.113725 0 0 0 0.113725 0 0 0 0.113725 0 0 0 0.5 0"/>
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1_19104"/>
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                <feOffset dx="1" dy="1"/>
                <feGaussianBlur stdDeviation="1"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0.45098 0 0 0 0 0.45098 0 0 0 0 0.45098 0 0 0 0.3 0"/>
                <feBlend mode="normal" in2="effect1_dropShadow_1_19104" result="effect2_dropShadow_1_19104"/>
                <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_1_19104" result="shape"/>
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                <feOffset dx="1" dy="1"/>
                <feGaussianBlur stdDeviation="1.5"/>
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0.113725 0 0 0 0.113725 0 0 0 0.113725 0 0 0 0.9 0"/>
                <feBlend mode="normal" in2="shape" result="effect3_innerShadow_1_19104"/>
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                <feOffset dx="-1" dy="-1"/>
                <feGaussianBlur stdDeviation="1"/>
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0.45098 0 0 0 0 0.45098 0 0 0 0 0.45098 0 0 0 0.9 0"/>
                <feBlend mode="normal" in2="effect3_innerShadow_1_19104" result="effect4_innerShadow_1_19104"/>
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                <feOffset dx="1" dy="-1"/>
                <feGaussianBlur stdDeviation="1"/>
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0.113725 0 0 0 0.113725 0 0 0 0.113725 0 0 0 0.2 0"/>
                <feBlend mode="normal" in2="effect4_innerShadow_1_19104" result="effect5_innerShadow_1_19104"/>
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                <feOffset dx="-1" dy="1"/>
                <feGaussianBlur stdDeviation="1"/>
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0.113725 0 0 0 0.113725 0 0 0 0.113725 0 0 0 0.2 0"/>
                <feBlend mode="normal" in2="effect5_innerShadow_1_19104" result="effect6_innerShadow_1_19104"/>
              </filter>
            </defs>
          </svg>
          <div className="home-hovered">
            <span>Home</span>
          </div>
          </button>
      </div>

      <div className="right-side">
        <button
          className={`media-button ${isMediaVisible ? 'active' : ''}`}
          onClick={onMediaToggle}
        >
          <img src={movieIcon} className="movie-icon" alt="Media files" />
        </button>
        <button
          className={`chat-button ${isChatVisible ? 'active' : ''}`}
          onClick={onChatToggle}
        >
          <svg width="30" height="31" viewBox="0 0 30 31" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g opacity={isChatVisible ? '1' : '0.45'}>
              <path opacity="0.64" d="M15 28C21.9036 28 27.5 22.4036 27.5 15.5C27.5 8.59644 21.9036 3 15 3C8.09644 3 2.5 8.59644 2.5 15.5C2.5 17.4996 2.96952 19.3895 3.80433 21.0656C4.02617 21.511 4.10001 22.0201 3.9714 22.5008L3.22689 25.2833C2.90369 26.4912 4.00877 27.5963 5.21668 27.2731L7.99923 26.5286C8.47992 26.4 8.98901 26.4738 9.43441 26.6957C11.1105 27.5305 13.0004 28 15 28Z" fill="#484848" fillOpacity="0.78"/>
              <path d="M9.78125 16.5625C9.21171 16.5625 8.75 17.0242 8.75 17.5937C8.75 18.1633 9.21171 18.625 9.78125 18.625H17.3438C17.9133 18.625 18.375 18.1633 18.375 17.5937C18.375 17.0242 17.9133 16.5625 17.3438 16.5625H9.78125Z" fill="black"/>
              <path d="M9.78125 11.75C9.21171 11.75 8.75 12.2117 8.75 12.7812C8.75 13.3508 9.21171 13.8125 9.78125 13.8125H20.7812C21.3508 13.8125 21.8125 13.3508 21.8125 12.7812C21.8125 12.2117 21.3508 11.75 20.7812 11.75H9.78125Z" fill="black"/>
            </g>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default MenuBar

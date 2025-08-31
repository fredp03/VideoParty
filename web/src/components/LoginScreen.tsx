import { useState } from 'react'
import svgPaths from './svgPaths'

interface LoginScreenProps {
  onLogin: () => void
}

function FrameAvalene() {
  return (
    <div className="bg-[#5e705b] box-border content-stretch flex flex-col gap-2.5 aspect-square items-center justify-center rounded-[18px] w-full h-full">
      <div className="font-['Joan:Regular',_sans-serif] leading-[0] not-italic shrink-0 text-[#e3e3e3] text-[clamp(1.5rem,2.5vw,2rem)] text-nowrap">
        <p className="leading-[normal] whitespace-pre">Avalene</p>
      </div>
    </div>
  )
}

function UserAvalene({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="w-[clamp(280px,25vw,350px)] aspect-square rounded-[18px] shadow-[-2px_2px_4px_0px_rgba(98,98,98,0.2),2px_-2px_4px_0px_rgba(98,98,98,0.2),-2px_-2px_4px_0px_rgba(255,255,255,0.9),2px_2px_5px_0px_rgba(98,98,98,0.9)] relative cursor-pointer hover:scale-105 transition-transform"
      data-name="User"
      onClick={onClick}
    >
      <FrameAvalene />
      <div className="absolute inset-0 pointer-events-none shadow-[1px_1px_2px_0px_inset_rgba(255,255,255,0.3),-1px_-1px_2px_0px_inset_rgba(98,98,98,0.5)] rounded-[18px]" />
    </div>
  )
}

function FrameFred() {
  return (
    <div className="bg-[#5b6470] box-border content-stretch flex flex-col gap-2.5 aspect-square items-center justify-center rounded-[18px] w-full h-full">
      <div className="font-['Joan:Regular',_sans-serif] leading-[0] not-italic shrink-0 text-[#e3e3e3] text-[clamp(1.5rem,2.5vw,2rem)] text-nowrap">
        <p className="leading-[normal] whitespace-pre">Fred</p>
      </div>
    </div>
  )
}

function UserFred({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="w-[clamp(280px,25vw,350px)] aspect-square rounded-[18px] shadow-[-2px_2px_4px_0px_rgba(98,98,98,0.2),2px_-2px_4px_0px_rgba(98,98,98,0.2),-2px_-2px_4px_0px_rgba(255,255,255,0.9),2px_2px_5px_0px_rgba(98,98,98,0.9)] relative cursor-pointer hover:scale-105 transition-transform"
      data-name="User"
      onClick={onClick}
    >
      <FrameFred />
      <div className="absolute inset-0 pointer-events-none shadow-[1px_1px_2px_0px_inset_rgba(255,255,255,0.3),-1px_-1px_2px_0px_inset_rgba(98,98,98,0.5)] rounded-[18px]" />
    </div>
  )
}

function ProfileSelectionScreen({ onSelectUser }: { onSelectUser: (user: string) => void }) {
  const backgroundStyle = {
    background: "#e8e8e8 url('/background-image.png') center/cover no-repeat",
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4"
      style={backgroundStyle}
      data-name="Netflix Party First Screen"
    >
      <div className="font-['Jacques_Francois:Regular',_sans-serif] leading-[0] not-italic text-[clamp(1.75rem,4vw,2.5rem)] text-black text-nowrap mt-24">
        <p className="leading-[normal] whitespace-pre">Who's Watching....</p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="flex gap-12 items-center justify-center flex-wrap">
          <UserFred onClick={() => onSelectUser('Fred')} />
          <UserAvalene onClick={() => onSelectUser('Avalene')} />
        </div>
      </div>
    </div>
  )
}

function UserGreeting({ selectedUser }: { selectedUser: string }) {
  const backgroundColor = selectedUser === 'Avalene' ? '#5e705b' : '#5b6470'

  return (
    <div className="rounded-[18px]" style={{ backgroundColor }}>
      <div className="box-border content-stretch flex font-['Joan:Regular',_sans-serif] gap-2.5 items-center justify-center leading-[0] not-italic px-[clamp(3rem,15vw,13.4375rem)] py-[clamp(0.75rem,2vh,1.6875rem)] text-[clamp(1.5rem,2.5vw,2rem)] text-nowrap text-[#e3e3e3]">
        <div className="relative shrink-0">
          <p className="leading-[normal] text-nowrap whitespace-pre">Hi</p>
        </div>
        <div className="relative shrink-0">
          <p className="leading-[normal] text-nowrap whitespace-pre">{selectedUser}</p>
        </div>
        <div className="relative shrink-0">
          <p className="leading-[normal] text-nowrap whitespace-pre">{`.... `}</p>
        </div>
      </div>
    </div>
  )
}

function VuesaxBulkLogout() {
  return (
    <div className="contents" data-name="vuesax/bulk/logout">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="logout">
          <path d={svgPaths.pf7f1700} fill="var(--fill-0, #292D32)" id="Vector" opacity="0.4" />
          <path d={svgPaths.pc716200} fill="var(--fill-0, #292D32)" id="Vector_2" />
          <g id="Vector_3" opacity="0"></g>
        </g>
      </svg>
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="opacity-[0.52] size-6 hover:opacity-80 transition-opacity"
      data-name="Back Button"
      onClick={onClick}
    >
      <VuesaxBulkLogout />
    </button>
  )
}

function LoginIcon() {
  return (
    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
      <g id="Login Button">
        <path d={svgPaths.p24fa2780} fill="var(--fill-0, black)" id="Vector" opacity="0.5" />
        <path clipRule="evenodd" d={svgPaths.p313d8a70} fill="var(--fill-0, black)" fillRule="evenodd" id="Vector_2" />
      </g>
    </svg>
  )
}

function LoginButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="shrink-0 size-6" data-name="Login Button">
      <LoginIcon />
    </button>
  )
}

function PasswordSubmitBox({ password, setPassword, onSubmit }: { password: string; setPassword: (v: string) => void; onSubmit: () => void }) {
  const [focused, setFocused] = useState(false)

  return (
    <div className="flex gap-[5px] items-center justify-center w-full max-w-[312px]" data-name="Password submit box">
      <div className="flex-1">
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={e => {
            if (e.key === 'Enter') onSubmit()
          }}
          placeholder="..."
          className={`w-full bg-transparent border-none outline-none font-['Jura:Regular',_sans-serif] font-normal leading-[normal] text-[clamp(1.25rem,2vw,1.5rem)] text-black placeholder:text-black/60 ${!focused && password === '' ? 'text-center' : 'text-left'}`}
        />
      </div>
      {password.trim().length > 0 && <LoginButton onClick={onSubmit} />}
    </div>
  )
}

function PasswordScreen({ selectedUser, onBack, onSubmit, password, setPassword, error }: { selectedUser: string; onBack: () => void; onSubmit: () => void; password: string; setPassword: (v: string) => void; error: string }) {
  const backgroundStyle = {
    background: "#e8e8e8 url('/background-image.png') center/cover no-repeat",
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 relative" style={backgroundStyle} data-name="Netflix Party First Screen">
      <div className="font-['Jacques_Francois:Regular',_sans-serif] leading-[0] not-italic text-[clamp(1.75rem,4vw,2.5rem)] text-black text-nowrap mt-24">
        <p className="leading-[normal] whitespace-pre">Who's Watching....</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="flex items-center justify-center mb-8 relative">
          <UserGreeting selectedUser={selectedUser} />
          <div className="absolute right-[-3rem] top-1/2 -translate-y-1/2">
            <BackButton onClick={onBack} />
          </div>
        </div>

        <div className="flex flex-col gap-6 items-center justify-center w-full max-w-md px-4">
          <div className="font-['Jura:SemiBold',_sans-serif] font-semibold leading-[0] text-[clamp(1.25rem,2vw,1.5rem)] text-black text-nowrap">
            <p className="leading-[normal] whitespace-pre">Password:</p>
          </div>
          <PasswordSubmitBox password={password} setPassword={setPassword} onSubmit={onSubmit} />
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      </div>
    </div>
  )
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (password === 'password') {
      onLogin()
    } else {
      setError('Incorrect password')
    }
  }

  const handleBack = () => {
    setSelectedUser(null)
    setPassword('')
    setError('')
  }

  if (selectedUser) {
    return (
      <PasswordScreen
        selectedUser={selectedUser}
        onBack={handleBack}
        onSubmit={handleSubmit}
        password={password}
        setPassword={setPassword}
        error={error}
      />
    )
  }

  return <ProfileSelectionScreen onSelectUser={setSelectedUser} />
}


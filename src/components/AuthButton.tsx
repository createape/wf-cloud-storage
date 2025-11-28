import { authClient, useSession } from '../lib/auth-client'

export function AuthButton() {
  const { data: session, isPending } = useSession()

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = '/ca/login'
        },
      },
    })
  }

  if (isPending) {
    return <div className="btn btn-ghost btn-sm loading">Loading...</div>
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {session.user.image && (
            <div className="avatar">
              <div className="w-8 rounded-full">
                <img src={session.user.image} alt={session.user.name || 'User'} />
              </div>
            </div>
          )}
          <span className="text-sm">{session.user.name || session.user.email}</span>
        </div>
        <button onClick={handleSignOut} className="btn btn-ghost btn-sm">
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <a href="/ca/login" className="btn btn-primary btn-sm">
      Sign In
    </a>
  )
}

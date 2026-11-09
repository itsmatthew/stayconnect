/** The little mailbox with its red flag, from Daily5Send.dc.html. */
export function MailboxIcon({ size }: { size: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true" style={{ display: "block", flex: "none" }}>
      <rect x="12.4" y="15" width="3.2" height="12" rx=".6" fill="#8C4A2B" stroke="#2B3350" strokeWidth="1" />
      <path d="M2.5 16V10.6C2.5 7.6 4.6 6 7.6 6H19.4c3 0 5 1.6 5 4.6V16Z" fill="#F4E9C8" stroke="#2B3350" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M2.5 16V10.6c0-2.4 1-3.9 2.8-4.4V16Z" fill="#DCCB9C" stroke="#2B3350" strokeWidth="1.8" strokeLinejoin="round" />
      <rect x="13" y="6.9" width="2.3" height="9.1" fill="#B43A2A" />
      <path d="M5.2 9.5c1.6-1.8 4.6-2.4 8-2.4" stroke="#FFFFFF" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity=".8" />
      <rect x="22.6" y="2.2" width="1.6" height="11" rx=".5" fill="#B43A2A" stroke="#6E1D13" strokeWidth=".8" />
      <path d="M24.2 2.2h3.6v3.6h-3.6z" fill="#E0482B" stroke="#6E1D13" strokeWidth=".8" strokeLinejoin="round" />
    </svg>
  );
}

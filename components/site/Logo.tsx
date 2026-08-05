import Image from 'next/image';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Image
      src="/logo.svg"
      alt="9ent"
      width={120}
      height={32}
      className={className}
      priority
    />
  );
}

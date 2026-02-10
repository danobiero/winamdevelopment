import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.png"

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 sm:gap-4 z-10">
      <div className="relative w-10 h-10 sm:w-[60px] sm:h-[60px]">
      <Image src={logo}  height="60" width="60"  alt="Praxida logo" className="object-contain"
          sizes="(max-width: 640px) 40px, 60px"/>
      </div>
      {/* Responsive text */}
      <span className="hidden sm:inline whitespace-nowrap text-xl text-blue-950 hover:text-logo-100 transition-colors font-medium">
        Practical Financial Foundation
      </span>
    </Link>
  );
}

export default Logo;

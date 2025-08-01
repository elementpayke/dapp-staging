import React from "react";
import Link from "next/link";
import { X, Linkedin, Instagram, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Company Info */}
          <div className="space-y-6 lg:col-span-2">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#4339CA] flex items-center justify-center shadow-lg">
                <div className="w-5 h-5 rounded-md bg-white"></div>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                ElementPay
              </span>
            </Link>
            <p className="text-gray-600 leading-relaxed max-w-md">
              Bridging the gap between cryptocurrency and everyday payments. 
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-600">
                <Mail className="w-5 h-5 text-blue-600" />
                <a href="mailto:elementpay.info@gmail.com" className="hover:text-gray-900 transition-colors">
                  elementpay.info@gmail.com
                </a>
              </div>
              <div className="flex items-center space-x-3 text-gray-600">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span>Nairobi, Kenya</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {/* X (Twitter) */}
              <Link
                href="https://x.com/element_pay?t=t6989wEzZq2L7APr8A3-hA&s=09"
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors group"
                target="_blank" rel="noopener noreferrer"
              >
                <img src="/twitter.png" alt="X (Twitter)" className="w-5 h-5 object-contain" />
              </Link>
              {/* LinkedIn */}
              <Link
                href="https://www.linkedin.com/company/elementpayhq/"
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors group"
                target="_blank" rel="noopener noreferrer"
              >
                <Linkedin className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
              </Link>
              {/* Instagram */}
              <Link
                href="https://www.instagram.com/elementpayhq?igsh=MTE4Y3ZzcHZ1NHg2MA=="
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors group"
                target="_blank" rel="noopener noreferrer"
              >
                <Instagram className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
              </Link>
              {/* TikTok */}
              <Link
                href="https://www.tiktok.com/@elementpay?_t=ZM-8yQXB3kb5Hy&_r=1"
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors group"
                target="_blank" rel="noopener noreferrer"
              >
                <img src="/tik-tok.png" alt="TikTok" className="w-5 h-5 object-contain" />
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-gray-600 hover:text-gray-900 transition-colors flex items-center group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-and-conditions"
                  className="text-gray-600 hover:text-gray-900 transition-colors flex items-center group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">Terms & Conditions</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/code-of-conduct"
                  className="text-gray-600 hover:text-gray-900 transition-colors flex items-center group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">Code of Conduct</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="mailto:elementpay.info@gmail.com"
                  className="text-gray-600 hover:text-gray-900 transition-colors flex items-center group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">Customer Support</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-col  justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-gray-500 text-sm">
              <p>© {new Date().getFullYear()} ElementPay. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

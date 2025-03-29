import React from "react";
import Link from "next/link";
import { X, Linkedin, Instagram,Send } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white">
      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-8">
          {/* Logo and Social Links */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#4339CA] flex items-center justify-center">
                <div className="w-4 h-4 rounded-sm bg-white"></div>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                ElementPay
              </span>
            </Link>
            <div className="flex gap-8 mt-6">
              <Link
                href="https://x.cohttps://x.com/elementpayhq"
                className="text-gray-900 hover:text-gray-600"
              >
                <X size={26} />
              </Link>
              <Link
                href="https://linkedin.com"
                className="text-gray-900 hover:text-gray-600"
              >
                <Linkedin size={26} />
              </Link>
              <Link
                href=""
                className="text-gray-900 hover:text-gray-600"
              >
                <Instagram size={26} />
              </Link>
              <Link
                href=""
                className="text-gray-900 hover:text-gray-600"
              >
                <Send size={26} />
              </Link>
            </div>
          </div>

          {/* About Us */}
          <div className="space-y-4">
            <h3 className="text-gray-900 font-semibold">About Us</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href=""
                  className="text-gray-600 hover:text-gray-900"
                >
                  Our story
                </Link>
              </li>
              <li>
                <Link
                  href=""
                  className="text-gray-600 hover:text-gray-900"
                >
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-gray-900 font-semibold">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href=""
                  className="text-gray-600 hover:text-gray-900"
                >
                  Payments
                </Link>
              </li>
              <li>
                <Link
                  href=""
                  className="text-gray-600 hover:text-gray-900"
                >
                  Virtual cards
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal and Support */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-gray-900 font-semibold">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href=""
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href=""
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Terms and Conditions
                  </Link>
                </li>
                <li>
                  <Link
                    href=""
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Cookies Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-gray-900 font-semibold">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href=""
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Customer support
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-gray-200">
          <p className="text-center text-gray-600">
            © 2024 Elementpay. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

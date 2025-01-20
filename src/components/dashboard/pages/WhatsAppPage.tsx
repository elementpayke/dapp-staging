// src/components/dashboard/pages/WhatsAppPage.tsx
import React from "react";
import { QrCode, Phone, ArrowRight, MessageCircle } from "lucide-react";

const WhatsAppPage = () => {
  return (
    <div className="p-4 sm:p-8 space-y-6">
      <h1 className="text-2xl font-semibold text-black mb-6">
        WhatsApp Support
      </h1>

      {/* Connection Status */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Connect WhatsApp
              </h2>
              <p className="text-sm text-gray-500">
                Scan QR code to connect your WhatsApp
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            Online
          </span>
        </div>

        <div className="bg-gray-50 p-8 rounded-lg flex flex-col items-center justify-center">
          <div className="w-48 h-48 bg-white p-4 rounded-lg shadow-sm flex items-center justify-center">
            <QrCode className="w-32 h-32 text-gray-800" />
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Scan this code with your phone&apos;s camera
          </p>
        </div>
      </div>

      {/* Support Contact */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Phone className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Direct Support
            </h2>
            <p className="text-sm text-gray-500">
              Contact our support team directly
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <div>
              <h3 className="font-medium text-gray-900">General Support</h3>
              <p className="text-sm text-gray-500">+254 703 417 782</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <div>
              <h3 className="font-medium text-gray-900">Technical Support</h3>
              <p className="text-sm text-gray-500">+254 703 417 783</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <div>
              <h3 className="font-medium text-gray-900">Business Inquiries</h3>
              <p className="text-sm text-gray-500">+254 703 417 784</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Support Hours */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Support Hours
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Monday - Friday</span>
            <span className="text-gray-900 font-medium">
              8:00 AM - 8:00 PM EAT
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Saturday</span>
            <span className="text-gray-900 font-medium">
              9:00 AM - 5:00 PM EAT
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Sunday</span>
            <span className="text-gray-900 font-medium">Closed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppPage;

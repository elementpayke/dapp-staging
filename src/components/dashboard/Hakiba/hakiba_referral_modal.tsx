"use client";
import React, { useState } from "react";
import { Clipboard, Mail, Send, Facebook, Instagram, Twitter, } from "lucide-react";

interface HakibaReferralModalProps {
    show: boolean;
    onClose: () => void;
}

export default function HakibaReferralModal({ show, onClose }: HakibaReferralModalProps) {
    if (!show) return null;

    const [email, setEmail] = useState("");
    const referralLink = "https://www.elementpay.io/referral?code=ABCD1234";

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        alert("Referral link copied!");
    };

    const handleSendEmail = () => {
        if (!email.trim()) return;
        alert(`Referral email sent to ${email}`);
        setEmail("");
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50" onClick={onClose}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <h2 className="text-lg font-semibold text-gray-700">Hakiba Referral</h2>

                {/* Referral Link Section */}
                <div className="mt-4">
                    <label className="text-gray-600 text-sm">Share referral link to</label>
                    <div className="flex items-center gap-2 mt-2 border rounded-lg px-3 py-2">
                        <input
                            type="text"
                            readOnly
                            value={referralLink}
                            className="flex-1 text-gray-800 text-sm bg-transparent outline-none"
                        />
                        <button className="bg-gray-200 px-3 py-1 rounded text-gray-700 text-sm" onClick={handleCopy}>
                            <Clipboard size={16} />
                        </button>
                    </div>
                </div>

                {/* Social Media Icons */}
                <div className="flex justify-center gap-4 mt-4">
                    <a href={`https://wa.me/?text=${encodeURIComponent(referralLink)}`} target="_blank" rel="noopener noreferrer">
                        <Facebook className="text-green-500 text-2xl cursor-pointer" />
                    </a>
                    <a href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}`} target="_blank" rel="noopener noreferrer">
                        <Send className="text-blue-400 text-2xl cursor-pointer" />
                    </a>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`} target="_blank" rel="noopener noreferrer">
                        <Facebook className="text-blue-600 text-2xl cursor-pointer" />
                    </a>
                    <a href={`https://www.instagram.com/?url=${encodeURIComponent(referralLink)}`} target="_blank" rel="noopener noreferrer">
                        <Instagram className="text-pink-500 text-2xl cursor-pointer" />
                    </a>
                    <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(referralLink)}`} target="_blank" rel="noopener noreferrer">
                        <Twitter className="text-black text-2xl cursor-pointer" />
                    </a>
                    <a href={`mailto:?subject=Hakiba Referral&body=Join Hakiba using this link: ${referralLink}`} target="_blank" rel="noopener noreferrer">
                        <Mail className="text-red-500 text-2xl cursor-pointer" />
                    </a>
                </div>

                {/* Divider */}
                <div className="flex items-center my-4">
                    <hr className="flex-1 border-gray-300" />
                    <span className="mx-2 text-gray-500 text-sm">OR</span>
                    <hr className="flex-1 border-gray-300" />
                </div>

                {/* Invite by Email */}
                <div className="mt-2">
                    <label className="text-gray-600 text-sm">Invite by Email</label>
                    <p className="text-xs text-gray-500">We'll send them an email with instructions on how to get a Hakiba loan.</p>
                    <div className="flex items-center gap-2 mt-2">
                        <input
                            type="email"
                            placeholder="name@example.com"
                            className="flex-1 border rounded-lg px-3 py-2 text-gray-800 text-sm outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <button
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                            onClick={handleSendEmail}
                        >
                            Send email
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

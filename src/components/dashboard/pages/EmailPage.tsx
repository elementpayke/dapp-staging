import React, { useState } from "react";
import emailjs from "emailjs-com";

const EmailPage = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("idle");

    try {
      await emailjs.send(
        "service_dhiqw4n",
        "template_ee1hpvr",
        {
          from_name: `${formData.firstName} ${formData.lastName}`,
          from_email: formData.email,
          message: formData.message,
          to_email: "elementpay.info@gmail.com",
        },
        "sXplFeRZc_SrSPHUL"
      );

      setStatus("success");
      setFormData({ firstName: "", lastName: "", email: "", message: "" }); // reset form
    } catch (error) {
      console.error("Failed to send email:", error);
      setStatus("error");
    }
  };



  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <h1 className="text-2xl font-semibold text-black">Email</h1>

      <div className="bg-white rounded-3xl p-8 shadow-sm">
        {status === "success" && (
          <div className="p-4 rounded-lg bg-green-50 text-green-700 border border-green-200">
            Your message has been sent successfully.
          </div>
        )}

        {status === "error" && (
          <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
            Failed to send message. Please try again or contact support directly.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700"
              >
                First name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                className="w-full p-3 rounded-lg bg-gray-50 border-none"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700"
              >
                Last name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                className="w-full p-3 rounded-lg bg-gray-50 border-none"
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="johndoe@example.com"
              className="w-full p-3 rounded-lg bg-gray-50 border-none"
            />
          </div>

          {/* Message Field */}
          <div className="space-y-2">
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Write your message here"
              rows={6}
              className="w-full p-3 rounded-lg bg-gray-50 border-none resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmailPage;

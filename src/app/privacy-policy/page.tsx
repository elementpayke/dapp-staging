/* eslint-disable react/no-unescaped-entities */
import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            ElementPay Privacy Policy
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Introduction
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Safeguarding your personal information and ensuring compliance with applicable legal
              frameworks are paramount to ElementPay. This Revised Privacy Policy outlines how
              ElementPay, operating as a Virtual Asset Service Provider (VASP), handles data collection,
              usage, and protection in accordance with Kenyan law.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              For clarity, all mentions of ElementPay refer to <a href="mailto:elementpay.info@gmail.com" className="text-blue-600 hover:text-blue-800">elementpay.info@gmail.com</a> and the ElementPay platform. Our platform offers
              innovative fintech solutions for streamlined payments and financial services within the virtual
              asset ecosystem.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By accessing and utilizing ElementPay, you explicitly agree to the data
              practices detailed herein, which have been updated to reflect the evolving regulatory landscape
              in Kenya.
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Collection of Your Personal Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ElementPay, in its capacity as a VASP, is mandated to adhere to stringent regulatory
              requirements, including those pertaining to Anti-Money Laundering (AML) and
              Counter-Terrorism Financing (CTF). Consequently, the collection of certain personal information
              is a legal imperative to ensure the integrity and security of our platform and to prevent illicit
              financial activities.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              1.1 Information We Collect Directly
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              In compliance with the Virtual Asset Service Providers Bill, 2025 and other relevant Kenyan legislation,
              ElementPay is required to collect and process personal information from its users. This direct collection
              is essential for fulfilling our statutory obligations, including Know Your Customer (KYC) and Customer
              Due Diligence (CDD) procedures.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              The specific categories of personal data collected may include, but are not limited to:
            </p>
            <ul className="space-y-3 text-gray-700 mb-6">
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Identification Information:</strong> Full legal name, date of birth, nationality, gender, and
                  unique identification numbers (e.g., National ID, Passport number).
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Contact Information:</strong> Residential address, email address, and telephone number.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Financial Information:</strong> Source of funds, transaction history, and other relevant financial
                  data necessary for AML/CTF compliance.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Biometric Data:</strong> Where permissible by law and with explicit consent, biometric data may
                  be collected for enhanced identity verification.
                </div>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              1.2 Information Collected During Wallet Connection and Transactional Activities
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you connect your cryptocurrency wallet to ElementPay and engage in transactional
              activities, the following information is automatically shared with or generated by our platform:
            </p>
            <ul className="space-y-3 text-gray-700 mb-6">
              <li className="flex items-start">
                <span className="font-semibold mr-2">a.</span>
                <div>
                  <strong>Public Wallet Address:</strong> Your public wallet address is received to facilitate and record
                  transactions on the blockchain network.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">b.</span>
                <div>
                  <strong>Transaction Data:</strong> Information pertinent to transactions executed through the platform,
                  such as transaction amounts, timestamps, recipient addresses, and associated metadata.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">c.</span>
                <div>
                  <strong>Device and Usage Information:</strong> Non-personal data, including IP addresses, device type,
                  operating system, browser version, and interaction logs.
                </div>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              1.3 Information Collected Through KYC Verification
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              ElementPay is now legally obligated to conduct Know Your Customer (KYC) verification for all users.
              This requirement stems directly from the VASP Bill, 2025, and the Proceeds of Crime and Anti-Money
              Laundering Act, 2009 (POCAMLA). KYC procedures are integral to our AML/CTF framework and are designed to:
            </p>
            <ul className="space-y-3 text-gray-700 mb-6">
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>Verify the identity of our users.</div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>Assess and mitigate risks associated with money laundering, terrorism financing, and other financial crimes.</div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>Comply with national and international regulatory standards.</div>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              1.4 Non-Personal Information
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              ElementPay may collect non-personal information, such as aggregated or anonymized data,
              which does not directly identify any individual. This information may include general usage
              patterns, market trends, and statistical insights into platform utilization.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              1.5 Transaction Information Retention
            </h3>
            <p className="text-gray-700 leading-relaxed">
              In the course of providing our services, ElementPay is legally required to retain comprehensive
              information related to transactions, including details pertaining to the sender and recipient.
              This information is retained to fulfill our legal and regulatory obligations, facilitate transaction
              tracking, ensure service transparency, and support potential investigations by competent authorities.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Sharing Information with Third Parties
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ElementPay is committed to safeguarding your personal information. We do not sell, rent, or
              lease your personal information to third parties for their independent marketing purposes.
              Our platform is designed to prioritize your privacy, ensuring that your data is handled securely
              and confidentially, in full compliance with the Data Protection Act and other applicable laws.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may engage trusted third-party service providers to facilitate various aspects of our
              operations, including identity verification (KYC/CDD), transaction processing, data storage,
              and cybersecurity. These partners are meticulously selected and are contractually bound to use
              your information solely for the provision of the agreed-upon services.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              ElementPay will only disclose your information to third parties if legally required or in good faith,
              believing that such action is necessary to:
            </p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="font-semibold mr-2">a.</span>
                <div>Comply with a legal obligation, court order, or governmental request.</div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">b.</span>
                <div>Protect the rights, property, or safety of ElementPay, its users, or the public.</div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">c.</span>
                <div>Enforce our terms of service or other agreements.</div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">d.</span>
                <div>Facilitate investigations into suspected illicit activities.</div>
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. Security of Your Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              At ElementPay, we are dedicated to ensuring the robust security of your interactions and
              personal information processed through our platform. We implement a comprehensive suite of
              technical and organizational security measures designed to protect personal data from
              unauthorized access, alteration, disclosure, or destruction.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              These measures include, but are not limited to, industry-standard encryption protocols, secure server
              infrastructure, access controls, and regular security audits. However, it is imperative to acknowledge
              that no method of transmission over the internet or electronic storage is entirely infallible.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Your Responsibilities:
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="font-semibold mr-2">a.</span>
                <div>
                  <strong>Wallet Security:</strong> You bear primary responsibility for the security of your cryptocurrency
                  wallet and any associated credentials. Maintain the confidentiality of your wallet details and implement
                  robust security practices.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">b.</span>
                <div>
                  <strong>Device Security:</strong> You are responsible for safeguarding your personal devices and any
                  access points to your cryptocurrency wallet from unauthorized use.
                </div>
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Your Personal Rights (Data Subject Rights)
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ElementPay recognizes and upholds the fundamental rights of data subjects as enshrined in the
              Data Protection Act, 2019. As a data controller, ElementPay is committed to facilitating the
              exercise of these rights. Your rights include:
            </p>
            <ul className="space-y-3 text-gray-700 mb-6">
              <li className="flex items-start">
                <span className="font-semibold mr-2">a.</span>
                <div>
                  <strong>Right to Information:</strong> You have the right to be informed about the collection and use of your personal data.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">b.</span>
                <div>
                  <strong>Right of Access:</strong> You have the right to request access to your personal data held by ElementPay.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">c.</span>
                <div>
                  <strong>Right to Rectification:</strong> You have the right to request the correction of inaccurate or incomplete personal data.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">d.</span>
                <div>
                  <strong>Right to Erasure:</strong> You have the right to request the deletion of your personal data where appropriate.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">e.</span>
                <div>
                  <strong>Right to Restriction of Processing:</strong> You have the right to request the restriction of processing in certain circumstances.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">f.</span>
                <div>
                  <strong>Right to Data Portability:</strong> You have the right to obtain and reuse your personal data for your own purposes.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">g.</span>
                <div>
                  <strong>Right to Object:</strong> You have the right to object to the processing of your personal data in certain situations.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">h.</span>
                <div>
                  <strong>Rights in Relation to Automated Decision Making:</strong> You have the right not to be subject to decisions based solely on automated processing.
                </div>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              4.1 Exercising Your Rights
            </h3>
            <p className="text-gray-700 leading-relaxed">
              To exercise any of your data subject rights, or if you have any inquiries regarding the processing
              of your personal data, please contact ElementPay at <a href="mailto:elementpay.info@gmail.com" className="text-blue-600 hover:text-blue-800">elementpay.info@gmail.com</a>. ElementPay will respond to your request within the timeframes
              stipulated by the Data Protection Act.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Retention of Your Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ElementPay retains personal data for as long as necessary to fulfill the purposes for which it
              was collected, including satisfying any legal, accounting, or reporting requirements. Our data
              retention policies are meticulously designed to comply with the Data Protection Act, the VASP Bill,
              and other relevant Kenyan laws.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Upon the expiration of the applicable retention period, or when personal data is no longer
              required for the purposes for which it was collected, ElementPay will securely delete or
              anonymize such data in accordance with industry best practices and legal mandates.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Third-Party Applications and Services
            </h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              6.1 Interaction with Third-Party Providers
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              ElementPay's services may integrate with or involve the use of third-party applications or
              services that may collect personal information and utilize cookies or similar tracking
              technologies. While these third-party providers operate independently, ElementPay exercises
              due diligence in collaborating only with entities that demonstrate adherence to relevant
              data protection laws and industry standards.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              6.2 Data Collection by Third Parties
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you interact with third-party services via the ElementPay platform, these parties may
              request and collect personal information. It is crucial to understand that such data is processed
              by the respective third party, and not directly by ElementPay, unless explicitly stated otherwise.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              6.3 Cookies and Tracking Technologies
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Third-party applications and services integrated with ElementPay may deploy cookies, web
              beacons, or other tracking technologies to collect data concerning your online activities.
              You retain control over your cookie preferences through your web browser settings.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              6.4 Sharing Information with Third Parties
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              To facilitate the provision of our services, ElementPay may share limited, non-sensitive
              information, such as public wallet addresses or transaction reference codes, with third-party
              providers. However, any personal data directly collected and processed by these third parties
              is governed by their respective privacy policies.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              6.5 Responsibility to Review Third-Party Policies
            </h3>
            <p className="text-gray-700 leading-relaxed">
              It is your sole responsibility to review and understand the privacy practices of any third-party
              services you engage with through the ElementPay platform. Should you have concerns regarding
              the manner in which your information is utilized by such third parties, we recommend that you
              contact them directly.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Children's Privacy
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ElementPay's services are not directed at individuals under the age of eighteen (18) years.
              We do not knowingly collect personal information from children. If we become aware that we have
              inadvertently collected personal data from a child without parental consent, we will take
              immediate steps to delete such information from our records.
            </p>
            <p className="text-gray-700 leading-relaxed">
              If you believe that a child has provided us with personal data, please contact us at <a href="mailto:elementpay.info@gmail.com" className="text-blue-600 hover:text-blue-800">elementpay.info@gmail.com</a>.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. Changes to This Privacy Policy
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ElementPay reserves the right to update or modify this Privacy Policy at any time to reflect
              changes in our practices, legal obligations, or the regulatory environment. Any revisions will
              be effective immediately upon posting the updated policy on our platform.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We encourage you to periodically review this Privacy Policy to stay informed about how ElementPay
              is protecting your information. Your continued use of the ElementPay platform following the posting
              of changes constitutes your acceptance of such changes.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Contact Information
            </h2>
            <p className="text-gray-700 leading-relaxed">
              For any questions, concerns, or requests pertaining to this Privacy Policy or ElementPay's data
              practices, please contact our Data Protection Officer at:
            </p>
            <p className="text-gray-700 mt-2">
              <strong>Email:</strong> <a href="mailto:elementpay.info@gmail.com" className="text-blue-600 hover:text-blue-800">elementpay.info@gmail.com</a>
            </p>
          </section>

          {/* Last Updated */}
          <div className="border-t pt-6 mt-8">
            <p className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsAndConditions() {
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
            ElementPay Terms and Conditions
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              These Revised Terms and Conditions ("Terms") govern your access to and use of all
              ElementPay products and services, including the ability to deposit and spend cryptocurrencies,
              unless separate terms are expressly stated. ElementPay operates as a Virtual Asset Service
              Provider (VASP) within the Republic of Kenya, providing innovative fintech solutions for
              streamlined payments and financial services within the virtual asset ecosystem.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              By accessing, using, or registering for any ElementPay services, you acknowledge that you have read,
              understood, and agree to be bound by these Terms, which constitute a legally binding
              agreement between you and ElementPay.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">
              1.1 Services Overview
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              ElementPay is a fintech platform designed to facilitate the conversion and utilization of
              cryptocurrencies within the fiat economy. Our platform enables users to convert digital assets
              into local fiat currencies and to spend them with ease. By connecting your cryptocurrency wallet
              to ElementPay, you can seamlessly deposit or withdraw your crypto and execute payments or
              transfers, all while ensuring compliance with applicable Kenyan laws and regulations.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">
              1.2 Legal Entity and Regulatory Status
            </h3>
            <p className="text-gray-700 leading-relaxed">
              ElementPay is a legal entity responsible for the development, management, and operation of
              the Services. It is imperative to note that ElementPay, as a VASP, is subject to the regulatory
              oversight of the relevant authorities in Kenya, including but not limited to the Capital Markets
              Authority (CMA) or any other body designated under the Virtual Asset Service Providers Bill,
              2025. ElementPay is committed to obtaining and maintaining all necessary licenses and authorizations
              required for its operations as a VASP in Kenya.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Eligibility
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To access and utilize the Services provided by ElementPay, you must satisfy the following
              stringent eligibility criteria:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              2.1 User Requirements
            </h3>
            <ul className="space-y-3 text-gray-700 mb-6">
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Age Requirement:</strong> You must be at least eighteen (18) years of age or of legal age in
                  your jurisdiction to enter into a legally binding agreement.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Legal Capacity:</strong> You must possess the full legal capacity and authority to enter into and
                  be bound by these Terms.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Compliance with Laws:</strong> You are solely responsible for ensuring your compliance with
                  all applicable local, national, and international laws, regulations, and guidelines.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Account Accuracy and Verification:</strong> You covenant to provide accurate, complete, and
                  up-to-date information during the registration and ongoing use of the Services.
                </div>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              2.2 Geographical and Other Restrictions
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              ElementPay is committed to operating within the confines of applicable laws and regulations.
              Accordingly, certain restrictions apply to the availability and use of our Services:
            </p>
            <ul className="space-y-3 text-gray-700 mb-6">
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Geographical Restrictions:</strong> ElementPay is currently available primarily in Kenya and
                  select regions within Eastern Africa.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Politically Exposed Persons (PEPs):</strong> ElementPay enforces stringent restrictions on
                  transactions involving individuals identified as Politically Exposed Persons.
                </div>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              2.3 Disclaimer of Liability for Restricted Use
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              By accessing or using ElementPay, you acknowledge and expressly agree that you are not located
              in any jurisdiction where the use of ElementPay Services is prohibited by law. ElementPay explicitly
              disclaims any and all liability for any legal, regulatory, or financial issues arising from your use
              of the Services from restricted locations.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              2.4 Wallet Connection and Custody Disclaimer
            </h3>
            <p className="text-gray-700 leading-relaxed">
              To utilize ElementPay, you must connect your cryptocurrency wallet. ElementPay does not take
              custody of, store, or manage your digital assets. All cryptocurrencies and fiat funds remain
              under the sole control and custody of the users. You are solely responsible for the security
              of your digital assets throughout their lifecycle on the platform.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. Use of the Services
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              3.1 Permitted Use
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You may use ElementPay exclusively for lawful purposes and in strict compliance with these
              Terms and all applicable laws and regulations. You agree not to violate any laws, interfere
              with system integrity, or engage in any prohibited activities including money laundering,
              terrorism financing, or fraud.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              3.2 Misuse of Services
            </h3>
            <p className="text-gray-700 leading-relaxed">
              Any misuse of the Services may result in immediate suspension or permanent termination of
              your access to the platform, forfeiture of any associated funds, and potential legal action,
              including reporting to relevant law enforcement and regulatory authorities.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Transactional Operations
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              4.1 Transaction Process
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Upon connecting your wallet to ElementPay, you can seamlessly initiate the deposit of
              cryptocurrency into your ElementPay account or withdraw it to your designated wallet.
              For spending, ElementPay facilitates payments by converting your cryptocurrency into
              local fiat currencies at prevailing market rates.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              4.2 Transaction Timing
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              While ElementPay endeavors to process transactions expeditiously, completion times may vary
              due to blockchain network congestion, confirmation times, liquidity availability, and external
              system delays.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              4.3 Transaction Limits and Refunds
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              ElementPay may impose transaction limits based on user verification levels, risk assessments,
              and market conditions. In instances where liquidity is insufficient, your cryptocurrency will
              be refunded to your originating wallet.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              4.4 Value Conversion and Exchange Rates
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              The value for transactions is determined based on prevailing market conditions at the time
              of conversion. The exchange rate applied at transaction initiation is final and binding.
              You acknowledge and accept the inherent risks associated with cryptocurrency price volatility.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              4.5 Costs and Fees
            </h3>
            <p className="text-gray-700 leading-relaxed">
              ElementPay is designed to be a free-to-use platform for certain core services. However,
              ElementPay reserves the right to charge fees for specific services. Any applicable fees
              will be clearly disclosed before transaction completion.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Third-Party Involvement and Disclaimers
            </h2>
            <p className="text-gray-700 leading-relaxed">
              ElementPay may partner with various third-party providers to facilitate services. While
              ElementPay exercises due diligence in selecting partners, ElementPay is not responsible
              for the actions, omissions, or failures of these third-party providers. You acknowledge
              and accept the inherent risks associated with reliance on third-party services.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Platform Operations and Risk Acknowledgement
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              6.1 Platform Operations and Decentralization
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              ElementPay operates as an on-ramp and off-ramp platform, enabling users to deposit and
              spend cryptocurrencies. While underlying blockchain technology may be decentralized,
              ElementPay operates as a centralized service provider facilitating access to these networks.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              6.2 Asset Control and Non-Custodial Nature
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              ElementPay does not take custody of, store, or manage your digital assets or fiat funds.
              All cryptocurrencies and fiat funds remain under your exclusive control and custody.
              You are solely responsible for the security of your digital assets.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              6.3 Security and User Responsibility
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You are solely responsible for securing your cryptocurrency wallet, private keys, and
              access credentials. ElementPay cannot be held liable for any loss, unauthorized access,
              or security breaches involving your digital assets.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              6.4 Irreversibility of Transactions
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              All transactions processed through ElementPay, once confirmed on the blockchain, are
              irreversible. Users must verify all payment details before initiating any transaction.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              6.5 Regulatory Status and Disclaimer
            </h3>
            <p className="text-gray-700 leading-relaxed">
              ElementPay is committed to operating in compliance with Kenyan law as a VASP. However,
              ElementPay is not a regulated financial institution in the traditional sense and does not
              hold licenses typically associated with banks or securities brokers.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Intellectual Property
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              7.1 Company Intellectual Property
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              All intellectual property rights in ElementPay's Services are exclusively owned by ElementPay.
              Users are granted a limited, non-exclusive, non-transferable, and revocable license to use
              the Services solely for personal, non-commercial purposes.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              7.2 User Submissions
            </h3>
            <p className="text-gray-700 leading-relaxed">
              By submitting any materials to ElementPay, you grant ElementPay a worldwide, royalty-free,
              perpetual license to use, reproduce, modify, and distribute such content in connection
              with the Services and ElementPay's business operations.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. Privacy and Data Protection
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              8.1 Data Collection and Processing
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              For comprehensive details on how ElementPay handles your personal information, please refer
              to our ElementPay Revised Privacy Policy. By using ElementPay, you consent to the collection,
              processing, and use of your data in accordance with our Privacy Policy and the Data Protection Act, 2019.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              8.2 Data Security
            </h3>
            <p className="text-gray-700 leading-relaxed">
              ElementPay implements robust technical and organizational measures to protect collected data
              from unauthorized access, alteration, disclosure, or destruction. However, no internet-connected
              system can guarantee absolute security.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Security Measures and User Responsibility
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              9.1 ElementPay Security Commitment
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              ElementPay is dedicated to ensuring the security of users' assets and transactions. Key
              security recommendations include maintaining wallet security, using strong authentication,
              regular monitoring, phishing awareness, and reporting suspicious activity.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              9.2 User Responsibility for Security
            </h3>
            <p className="text-gray-700 leading-relaxed">
              The ultimate responsibility for safeguarding your cryptocurrency wallet, private keys, and
              digital assets rests with you. ElementPay disclaims liability for losses arising from your
              failure to adequately secure your credentials.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Limitation of Liability
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              10.1 No Warranties
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              ElementPay provides its Services on an "as is" and "as available" basis, without any warranties
              of any kind. ElementPay does not warrant service availability, performance, or security.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              10.2 Limitation of Damages
            </h3>
            <p className="text-gray-700 leading-relaxed">
              To the maximum extent permitted by law, ElementPay shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages. ElementPay's total liability shall
              not exceed the amount paid by you for accessing the Services during the preceding twelve months.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              11. Governing Law and Dispute Resolution
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              11.1 Governing Law
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              These Terms shall be governed by the laws of the Republic of Kenya. You submit to the
              exclusive jurisdiction of the courts of Kenya for dispute resolution.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              11.2 Dispute Resolution
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Any disputes shall be resolved through binding arbitration in Nairobi, Kenya, in accordance
              with the Chartered Institute of Arbitrators (Kenya Branch) rules.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              11.3 User Responsibility for Legal Compliance
            </h3>
            <p className="text-gray-700 leading-relaxed">
              You are solely responsible for ensuring your use of the Services adheres to all applicable
              laws in your jurisdiction. ElementPay disclaims responsibility for your failure to comply
              with local laws and regulations.
            </p>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              12. Modification to the Services and Terms
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              12.1 Changes to the Services
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              ElementPay reserves the right to modify, suspend, or discontinue any aspect of the Services
              at its sole discretion, with or without notice.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              12.2 Changes to the Terms
            </h3>
            <p className="text-gray-700 leading-relaxed">
              ElementPay reserves the right to modify these Terms at any time. Changes will be reflected
              in an updated version with a revised "Last Updated" date. Your continued use constitutes
              acceptance of the revised Terms.
            </p>
          </section>

          {/* Section 13 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              13. Termination
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              13.1 Termination by ElementPay
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              ElementPay reserves the right to terminate or suspend your account at any time, with or
              without notice, for violations of these Terms or any other conduct deemed harmful.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              13.2 Termination by You
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the right to terminate your account at any time by following the instructions
              provided within the Services.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              13.3 Effect of Termination
            </h3>
            <p className="text-gray-700 leading-relaxed">
              Upon termination, all rights and licenses granted will cease. Certain provisions will
              survive termination, including intellectual property, disclaimers, and dispute resolution clauses.
            </p>
          </section>

          {/* Section 14 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              14. Contact Information
            </h2>
            <p className="text-gray-700 leading-relaxed">
              For any questions, concerns, or requests pertaining to these Terms or ElementPay's Services,
              please contact us at:
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

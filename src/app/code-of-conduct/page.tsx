/* eslint-disable react/no-unescaped-entities */
import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CodeOfConduct() {
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
            ElementPay Code of Conduct
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Introduction and Purpose
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              This ElementPay Revised Code of Conduct (&ldquo;Code&rdquo;) establishes the fundamental principles,
              ethical standards, and behavioral expectations for all individuals engaging with the ElementPay
              ecosystem, including but not limited to users, employees, contractors, partners, and stakeholders.
              As a Virtual Asset Service Provider (VASP) operating within the Republic of Kenya, ElementPay
              is committed to fostering a secure, transparent, and compliant environment that adheres to the
              highest standards of integrity, professionalism, and legal probity.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              This Code is designed to complement and reinforce ElementPay&apos;s commitment to all applicable laws and regulations,
              including the Virtual Asset Service Providers Bill, 2025 (the &ldquo;VASP Bill&rdquo;), the Proceeds of
              Crime and Anti-Money Laundering Act, 2009 (POCAMLA), and the Data Protection Act,
              2019 (DPA).
            </p>
            <p className="text-gray-700 leading-relaxed">
              By accessing, using, or otherwise interacting with ElementPay&apos;s platform and services, all
              individuals are deemed to have read, understood, and agreed to abide by the provisions of this
              Code. Adherence to this Code is paramount for maintaining the trust and confidence of our
              community and regulatory authorities.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Core Values and Principles
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ElementPay's operations and interactions are underpinned by the following core values, which
              guide our conduct and decision-making:
            </p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Integrity and Ethical Conduct:</strong> Upholding the highest standards of honesty, transparency,
                  and accountability in all dealings. This includes a steadfast commitment to preventing and
                  reporting illicit activities, such as money laundering, terrorism financing, and fraud.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Compliance with Law and Regulation:</strong> Strict adherence to all applicable local, national,
                  and international laws, regulations, and guidelines governing virtual assets, financial
                  services, data protection, and anti-financial crime measures.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Respect and Non-Discrimination:</strong> Treating all individuals with dignity, respect, and
                  fairness, irrespective of their background, role, or perspective. ElementPay is committed to
                  an inclusive environment free from harassment, discrimination, or any form of
                  inappropriate behavior.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Transparency and Accountability:</strong> Operating with openness and clarity, particularly
                  concerning our services, fees, risks, and data handling practices.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Security and Privacy:</strong> Prioritizing the security of our platform and the protection of user
                  data. This involves implementing robust technical and organizational measures to
                  safeguard information and respecting individual privacy rights.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Innovation and Responsible Growth:</strong> Encouraging creativity and the pursuit of
                  technological advancements while ensuring that innovation is balanced with robust risk
                  management, consumer protection, and regulatory compliance.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Customer Focus and Service Excellence:</strong> Prioritizing the needs and interests of our users,
                  striving to provide seamless, secure, and reliable services.
                </div>
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. Expected Behavior and Professional Standards
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              All individuals engaging with the ElementPay ecosystem are expected to conduct themselves in
              a manner that reflects positively on ElementPay and its community. This includes, but is not
              limited to:
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              3.1 Compliance with Legal and Regulatory Obligations
            </h3>
            <ul className="space-y-3 text-gray-700 mb-6">
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Adherence to KYC/AML/CTF Procedures:</strong> All users must fully cooperate with
                  ElementPay's Know Your Customer (KYC) and Customer Due Diligence (CDD) procedures.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Prohibition of Illicit Activities:</strong> Engaging in, facilitating, or attempting to facilitate any
                  illegal activities is strictly prohibited.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Data Protection and Privacy:</strong> Handling all personal data in strict accordance with the DPA
                  and ElementPay's Privacy Policy.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Sanctions Compliance:</strong> Adhering to all applicable national and international sanctions
                  regimes.
                </div>
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              3.2 Ethical Conduct and Professionalism
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Honesty and Integrity:</strong> Acting truthfully and with integrity in all interactions.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Fair Dealing:</strong> Engaging in fair and ethical practices in all business dealings.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Confidentiality:</strong> Protecting ElementPay's proprietary information, trade secrets, and user data.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Respectful Communication:</strong> Engaging in open, honest, and constructive communication.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Responsible Use of Resources:</strong> Utilizing ElementPay's resources responsibly and only for authorized purposes.
                </div>
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Unacceptable Behavior
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The following behaviors are strictly prohibited and constitute a material violation of this Code:
            </p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Harassment and Discrimination:</strong> Any form of harassment, bullying, intimidation, or
                  discrimination based on race, ethnicity, gender, sexual orientation, religion, disability, age,
                  or any other protected characteristic.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Fraudulent or Deceptive Practices:</strong> Engaging in any activity intended to defraud, deceive,
                  or mislead ElementPay, its users, or any third party.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Violation of AML/CTF Laws:</strong> Any act or omission that violates anti-money laundering or
                  counter-terrorism financing laws.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Unauthorized Access or System Interference:</strong> Attempting to gain unauthorized access to
                  ElementPay's systems, user accounts, or data.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Intellectual Property Infringement:</strong> Unauthorized use, reproduction, or distribution of
                  ElementPay's intellectual property or the intellectual property of third parties.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Retaliation:</strong> Any form of retaliation against individuals who report concerns or violations
                  in good faith.
                </div>
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Reporting Violations
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ElementPay encourages all individuals to report any suspected violations of this Code,
              ElementPay policies, or applicable laws and regulations. Reports can be made through the
              following channels:
            </p>
            <ul className="space-y-3 text-gray-700 mb-4">
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Designated Reporting Channels:</strong> Specific reporting mechanisms will be provided within
                  the ElementPay platform or on its official website.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Email:</strong> Reports can be sent to <a href="mailto:elementpay.info@gmail.com" className="text-blue-600 hover:text-blue-800">elementpay.info@gmail.com</a>
                </div>
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              All reports will be handled with strict confidentiality and investigated promptly and impartially.
              ElementPay prohibits any form of retaliation against individuals who make good faith reports of
              suspected misconduct.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Enforcement and Consequences
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              ElementPay is committed to the rigorous enforcement of this Code. Violations will be addressed
              promptly and may result in a range of disciplinary actions, depending on the severity and nature
              of the misconduct. Consequences may include, but are not limited to:
            </p>
            <ul className="space-y-3 text-gray-700 mb-4">
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Warnings and Remedial Actions:</strong> Formal warnings, mandatory training, or requirements to
                  rectify non-compliant behavior.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Suspension of Services:</strong> Temporary suspension of access to ElementPay services.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Termination of Access:</strong> Permanent termination of access to ElementPay services and
                  account closure.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Legal Action:</strong> Pursuit of civil remedies or referral to relevant regulatory and law
                  enforcement authorities for criminal prosecution.
                </div>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">•</span>
                <div>
                  <strong>Forfeiture of Funds:</strong> In cases of illicit activities, ElementPay reserves the right to freeze
                  and/or forfeit funds in accordance with legal mandates and regulatory directives.
                </div>
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              All reported incidents will be reviewed by ElementPay's designated compliance team or legal
              department, ensuring fairness, objectivity, and adherence to due process.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Review and Amendments
            </h2>
            <p className="text-gray-700 leading-relaxed">
              ElementPay reserves the right to review, update, or amend this Code of Conduct periodically to
              reflect changes in legal and regulatory requirements, industry best practices, or ElementPay's
              operational needs. Any revisions will be effective immediately upon posting the updated Code on
              our official platforms. Users and stakeholders are encouraged to review this Code regularly to
              stay informed of their obligations. Continued engagement with ElementPay's services following
              any amendments constitutes acceptance of the revised Code.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. Contact Information
            </h2>
            <p className="text-gray-700 leading-relaxed">
              For any questions or clarifications regarding this Code of Conduct, please contact ElementPay's
              Compliance Department at:
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

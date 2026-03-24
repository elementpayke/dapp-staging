import React from "react";

const testimonials = [
  {
    name: "David",
    location: "Nairobi",
    feedback:
      "I paid for my boda ride with just 50 KES using USDC. No waiting, just pure convenience!",
  },
  {
    name: "Jane",
    location: "Kisumu",
    feedback:
      "I used ElementPay to shop for groceries worth 5000 KES. Quick, secure, and seamless. This is the future of payments!",
  },
  {
    name: "Julius",
    location: "Mombasa",
    feedback:
      "Paid Mama Mboga 20 KES for veggies using crypto. I never thought this day would come!",
  },
  {
    name: "Rachel",
    location: "Nyeri",
    feedback:
      "ElementPay is my go-to for paying everyday bills—from transport to shopping. All in one place, fast and affordable.",
  },
];

const Testimonials = () => {
  return (
    <div className="py-20 px-6 md:px-12" style={{ backgroundColor: "var(--landing-bg-subtle)" }}>
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-[var(--landing-heading)] mb-10">
          Real Stories. Real Impact.
        </h2>
        <p className="text-lg text-[var(--landing-body)] mb-16 max-w-2xl mx-auto">
          ElementPay is transforming how Kenyans make payments—whether for your daily commute,
          shopping, or paying your local vendor. Here&apos;s how we&apos;re making it easier for
          everyday transactions.
        </p>

        <div className="grid md:grid-cols-2 gap-10">
          {testimonials.map((item, index) => (
            <div
              key={index}
              className="rounded-2xl shadow-md p-6 text-left border-l-4 border-[var(--landing-accent)]"
              style={{ backgroundColor: "var(--landing-card-bg)" }}
            >
              <p className="italic mb-4 text-[var(--landing-body)]">
                &quot;{item.feedback}&quot;
              </p>
              <p className="text-sm font-semibold text-[var(--landing-muted)]">
                — {item.name}, {item.location}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;

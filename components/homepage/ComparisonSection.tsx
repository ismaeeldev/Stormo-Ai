'use client';

import React from 'react';
import { Check, Minus } from 'lucide-react';

export default function ComparisonSection() {
  const comparisonData = [
    {
      feature: 'Daily action plan tailored to your niche',
      stormo: true,
      diy: false,
      ads: false,
      freelancer: true,
      genericAi: false,
    },
    {
      feature: 'Written content drafts (social, outreach, blog)',
      stormo: true,
      diy: false,
      ads: false,
      freelancer: true,
      genericAi: true,
    },
    {
      feature: 'Micro-influencer lookup and status CRM',
      stormo: true,
      diy: false,
      ads: false,
      freelancer: true,
      genericAi: false,
    },
    {
      feature: 'Monthly cost',
      stormo: '$29/mo ($9 first month)',
      diy: 'Free (but costs time)',
      ads: '$500+/mo budget',
      freelancer: '$1,000+/mo retainer',
      genericAi: '$20/mo subscription',
    },
    {
      feature: 'No marketing experience required',
      stormo: true,
      diy: false,
      ads: false,
      freelancer: true,
      genericAi: false,
    },
  ];

  const cellClass = "py-4 px-3 sm:px-6 text-center text-xs sm:text-sm border-b border-gray-100/70";

  return (
    <section className="relative py-24 bg-[#F5F5F5] pb-24 sm:pb-32 md:pb-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Headline */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-dark tracking-tight">
            Why Stormo Beats Every Alternative
          </h2>
          <p className="text-subtle text-base sm:text-lg mt-3">
            Compare how Stormo stacks up against other customer acquisition channels.
          </p>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.03)] border border-gray-100/50 overflow-x-auto">
          <table className="w-full table-auto border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#1A1A1A] text-white">
                <th className="py-4.5 px-4 sm:px-6 text-left font-bold text-xs sm:text-sm">Feature / Channel</th>
                <th className="py-4.5 px-3 sm:px-6 text-center font-bold text-xs sm:text-sm bg-primary">Stormo.io</th>
                <th className="py-4.5 px-3 sm:px-6 text-center font-bold text-xs sm:text-sm">DIY (Manual)</th>
                <th className="py-4.5 px-3 sm:px-6 text-center font-bold text-xs sm:text-sm">Paid Ads</th>
                <th className="py-4.5 px-3 sm:px-6 text-center font-bold text-xs sm:text-sm">Freelancer</th>
                <th className="py-4.5 px-3 sm:px-6 text-center font-bold text-xs sm:text-sm">Generic AI</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-4 sm:px-6 text-left font-semibold text-dark text-xs sm:text-sm border-b border-gray-100/70 max-w-xs">
                    {row.feature}
                  </td>
                  
                  {/* Stormo Column Highlighted in #FDF0E8 */}
                  <td className={`${cellClass} bg-[#FFFBF9] font-bold text-primary border-x border-primary/10`}>
                    {typeof row.stormo === 'boolean' ? (
                      <span className="inline-flex items-center justify-center bg-primary/10 p-1 rounded-full">
                        <Check className="h-4 w-4 text-primary" />
                      </span>
                    ) : (
                      row.stormo
                    )}
                  </td>

                  {/* DIY Column */}
                  <td className={cellClass}>
                    {typeof row.diy === 'boolean' ? (
                      row.diy ? <Check className="h-4 w-4 text-primary mx-auto" /> : <Minus className="h-4 w-4 text-muted mx-auto" />
                    ) : (
                      row.diy
                    )}
                  </td>

                  {/* Paid Ads Column */}
                  <td className={cellClass}>
                    {typeof row.ads === 'boolean' ? (
                      row.ads ? <Check className="h-4 w-4 text-primary mx-auto" /> : <Minus className="h-4 w-4 text-muted mx-auto" />
                    ) : (
                      row.ads
                    )}
                  </td>

                  {/* Freelancer Column */}
                  <td className={cellClass}>
                    {typeof row.freelancer === 'boolean' ? (
                      row.freelancer ? <Check className="h-4 w-4 text-primary mx-auto" /> : <Minus className="h-4 w-4 text-muted mx-auto" />
                    ) : (
                      row.freelancer
                    )}
                  </td>

                  {/* Generic AI Column */}
                  <td className={cellClass}>
                    {typeof row.genericAi === 'boolean' ? (
                      row.genericAi ? <Check className="h-4 w-4 text-primary mx-auto" /> : <Minus className="h-4 w-4 text-muted mx-auto" />
                    ) : (
                      row.genericAi
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Double Layered Slant Divider */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0] transform translate-y-[1px] z-10">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[40px] md:h-[60px] fill-white">
          <path d="M0,20 L600,60 L1200,0 L1200,120 L0,120 Z" opacity="0.3" />
          <path d="M0,50 L600,90 L1200,30 L1200,120 L0,120 Z" />
        </svg>
      </div>
    </section>
  );
}

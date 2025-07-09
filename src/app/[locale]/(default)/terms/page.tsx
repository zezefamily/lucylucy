interface TermsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

type SectionWithItems = {
  title: string;
  items: { label: string; content: string; }[];
};

type SectionWithContent = {
  title: string;
  content: string;
};

type SectionWithContact = {
  title: string;
  intro: string;
  email: string;
};

type Section = SectionWithItems | SectionWithContent | SectionWithContact;

export default async function Terms({ params }: TermsPageProps) {
  const { locale } = await params;
  const isZh = locale === 'zh' || locale === 'zh-CN';

  const content = {
    en: {
      title: "Lucy AI Terms of Service",
      effectiveDate: "Effective Date: July 8, 2025",
      introduction: "Welcome to Lucy AI. These Terms of Service (\"Terms\") apply to the Lucy AI service (\"Service\"), provided by BLUE BOX AI LIMITED (\"Company,\" \"we,\" or \"us\"). By accessing or using the Service, you agree to comply with these Terms and all applicable laws in the United States and the European Economic Area (EEA). If you do not agree, please discontinue use of the Service.",
      sections: {
        "1": {
          title: "1. Account Registration",
          items: [
            { label: "Eligibility:", content: "You must be at least 16 years old (or the legal age in your jurisdiction) to use the Service." },
            { label: "Accuracy of Information:", content: "You must provide true, complete, and up-to-date registration information." },
            { label: "Account Security:", content: "You are responsible for safeguarding your account credentials. Any liability arising from credential compromise is your responsibility." }
          ]
        } as SectionWithItems,
        "2": {
          title: "2. Use of the Service",
          items: [
            { label: "Permitted Use:", content: "You may use the Service only for lawful purposes and in accordance with these Terms." },
            { label: "Prohibited Content:", content: "You may not upload or share illegal, harmful, infringing, or inappropriate content." },
            { label: "AI Disclaimer:", content: "Lucy AI offers suggestions and conversational assistance; it is not a substitute for professional legal, medical, or psychological advice." }
          ]
        } as SectionWithItems,
        "3": {
          title: "3. Intellectual Property",
          items: [
            { label: "Ownership:", content: "All content, trademarks, and technology within the Service are owned by the Company or its licensors." },
            { label: "License:", content: "We grant you a limited, non-exclusive, non-transferable license to use the Service." },
            { label: "Restrictions:", content: "You may not copy, modify, distribute, or reverse-engineer the Service without authorization." }
          ]
        } as SectionWithItems,
        "4": {
          title: "4. Privacy and Data Protection",
          items: [
            { label: "Privacy Policy:", content: "Our Privacy Policy explains how we collect and use your data. Your use of the Service constitutes agreement to that Policy." },
            { label: "Data Transfers:", content: "For users in the EEA, cross-border data transfers are protected by Standard Contractual Clauses or equivalent safeguards." }
          ]
        } as SectionWithItems,
        "5": {
          title: "5. Fees and Payments",
          items: [
            { label: "Subscription Plans:", content: "Some features require payment of subscription fees. Details are available on the pricing page." },
            { label: "Refund Policy:", content: "Subscription fees are non-refundable except as required by law." }
          ]
        } as SectionWithItems,
        "6": {
          title: "6. Termination of Service",
          items: [
            { label: "By You:", content: "You may delete your account at any time in your account settings or by contacting us via email." },
            { label: "By Us:", content: "We reserve the right to suspend or terminate your access if you violate these Terms." }
          ]
        } as SectionWithItems,
        "7": {
          title: "7. Disclaimers and Limitation of Liability",
          items: [
            { label: "\"As Is\" Basis:", content: "The Service is provided \"as is\" and \"as available\" without any explicit or implied warranties." },
            { label: "Liability Cap:", content: "To the maximum extent permitted by law, our liability for any claim arising from your use of the Service is limited to the total subscription fees you have paid in the 12 months preceding the claim." }
          ]
        } as SectionWithItems,
        "8": {
          title: "8. Governing Law and Dispute Resolution",
          items: [
            { label: "Governing Law:", content: "These Terms are governed by the laws of the State of California, USA, and applicable consumer protection laws in the EEA." },
            { label: "Dispute Resolution:", content: "U.S. users agree to resolve disputes in California courts; EEA users may bring disputes in competent courts in their jurisdiction." }
          ]
        } as SectionWithItems,
        "9": {
          title: "9. Changes to Terms",
          content: "We may update these Terms from time to time and will notify you of significant changes via in-app notifications or email. Continued use after changes constitutes acceptance."
        } as SectionWithContent,
        "10": {
          title: "10. Contact Us",
          intro: "If you have any questions or concerns, please contact us at:",
          email: "Email: support@lucyai.io"
        } as SectionWithContact
      },
      footer: "Thank you for choosing Lucy AI. We look forward to helping you connect more authentically with others."
    },
    zh: {
      title: "Lucy AI 服务条款",
      effectiveDate: "生效日期：2025 年 7 月 8 日",
      introduction: "欢迎使用 Lucy AI。本服务条款（\"条款\"）适用于由 BLUE BOX AI LIMITED （\"公司\"、\"我们\"）提供的 Lucy AI 服务（\"服务\"）。访问或使用本服务，即表示您同意遵守本条款及美国和欧洲经济区（ EEA ）适用法律。如您不同意，请停止使用本服务。",
      sections: {
        "1": {
          title: "1. 账户注册",
          items: [
            { label: "使用资格：", content: "您必须年满 16 周岁（或您所在国家/地区法定成年年龄）方可使用本服务。" },
            { label: "信息准确性：", content: "您需提供真实、完整、最新的注册信息。" },
            { label: "账户安全：", content: "您需妥善保管账户凭证，因凭证泄露导致的任何责任由您自行承担。" }
          ]
        } as SectionWithItems,
        "2": {
          title: "2. 服务使用",
          items: [
            { label: "许可用途：", content: "仅可为合法目的使用本服务，并遵守本条款。" },
            { label: "禁止内容：", content: "不得上传或分享违法、有害、侵权或不当内容。" },
            { label: "AI 免责声明：", content: "Lucy AI 提供建议和对话辅助，不可替代专业法律、医疗或心理咨询。" }
          ]
        } as SectionWithItems,
        "3": {
          title: "3. 知识产权",
          items: [
            { label: "所有权：", content: "服务中的所有内容、商标及技术均归公司或其许可方所有。" },
            { label: "使用许可：", content: "公司授予您有限、非排他、不可转让的使用许可。" },
            { label: "限制：", content: "未经授权，不得复制、修改、分发或进行反向工程。" }
          ]
        } as SectionWithItems,
        "4": {
          title: "4. 隐私与数据保护",
          items: [
            { label: "隐私政策：", content: "我们的《隐私政策》解释了数据收集和使用方式，使用本服务即表示您同意该政策。" },
            { label: "数据传输：", content: "对于欧洲用户，数据跨境传输受标准合同条款或同等保障措施保护。" }
          ]
        } as SectionWithItems,
        "5": {
          title: "5. 费用与支付",
          items: [
            { label: "订阅计划：", content: "部分功能需支付订阅费用，详情请参见定价页面。" },
            { label: "退款政策：", content: "订阅费用不予退还，法律另有规定的除外。" }
          ]
        } as SectionWithItems,
        "6": {
          title: "6. 服务终止",
          items: [
            { label: "您主动：", content: "您可随时在账户设置中删除账户，可发送邮件联系我们操作。" },
            { label: "我们注销：", content: "若您违反本条款，我们保留暂停或终止您访问权限的权利。" }
          ]
        } as SectionWithItems,
        "7": {
          title: "7. 免责声明与责任限制",
          items: [
            { label: "按现状提供：", content: "服务按「现状」及「可用」状态提供，不作任何明示或暗示担保。" },
            { label: "责任上限：", content: "在法律允许范围内，公司对因使用本服务产生的责任限于您过去 12 个月内支付的费用总额。" }
          ]
        } as SectionWithItems,
        "8": {
          title: "8. 适用法律与争议解决",
          items: [
            { label: "适用法律：", content: "本条款适用美国加利福尼亚州法律及 EEA 消费者保护法规。" },
            { label: "争议解决：", content: "美国用户提交加州法院；欧洲用户提交当地有管辖权法院。" }
          ]
        } as SectionWithItems,
        "9": {
          title: "9. 条款变更",
          content: "我们可能不时更新本条款，通过应用内通知或邮件告知重大变更。变更生效后，继续使用即视为接受。"
        } as SectionWithContent,
        "10": {
          title: "10. 联系我们",
          intro: "如有疑问或意见，请联系：",
          email: "邮箱： support@lucyai.io"
        } as SectionWithContact
      },
      footer: "感谢您选择 Lucy AI，我们期待帮助您更真实自然地连接他人。"
    }
  };

  const currentContent = isZh ? content.zh : content.en;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentContent.title}</h1>
        <p className="text-gray-600 mb-8">{currentContent.effectiveDate}</p>
        
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <p className="text-gray-700 leading-relaxed">
            {currentContent.introduction}
          </p>
        </div>

        {Object.entries(currentContent.sections).map(([key, section]) => (
          <section key={key} className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{section.title}</h2>
            
            {'items' in section ? (
              <ul className="space-y-6 text-gray-700">
                {section.items.map((item, index) => (
                  <li key={index} className="mb-4">
                    <h3 className="font-medium text-lg text-gray-900 mb-2">{item.label}</h3>
                    <p className="text-gray-700">{item.content}</p>
                  </li>
                ))}
              </ul>
            ) : 'content' in section ? (
              <p className="text-gray-700">{section.content}</p>
            ) : (
              <div>
                <p className="text-gray-700 mb-4">{section.intro}</p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800 font-medium">{section.email}</p>
                </div>
              </div>
            )}
          </section>
        ))}

        <div className="border-t border-gray-200 pt-8 mt-8">
          <p className="text-gray-600 text-center italic">
            {currentContent.footer}
          </p>
        </div>
      </div>
    </div>
  );
}
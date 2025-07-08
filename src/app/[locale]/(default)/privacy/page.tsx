interface PrivacyPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function Privacy({ params }: PrivacyPageProps) {
  const { locale } = await params;
  const isZh = locale === 'zh' || locale === 'zh-CN';

  const content = {
    en: {
      title: "Lucy AI Privacy Policy",
      effectiveDate: "Effective Date: July 5, 2025",
      introduction: "This Privacy Policy (\"Policy\") applies to the Lucy AI service (\"Service\"), developed and operated by BLUE BOX AI LIMITED (\"Company,\" \"we,\" or \"us\"). We respect and protect your privacy and comply with applicable laws and regulations in the United States and the European Economic Area (EEA), including the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).",
      sections: {
        "1": {
          title: "1. Information We Collect",
          items: [
            { label: "Registration Data:", content: "Username, email address." },
            { label: "Profile & Preferences:", content: "Basic information you provide to enhance your experience." },
            { label: "Usage Data:", content: "Login history, feature usage, session logs, AI-generated content." },
            { label: "Device & Technical Data:", content: "IP address, device identifiers, operating system, browser type and version." },
            { label: "Cookies & Similar Technologies:", content: "Used to remember your preferences and maintain session state." }
          ]
        },
        "2": {
          title: "2. How We Use Your Data",
          intro: "We use your information to:",
          items: [
            "Provide, maintain, and improve Lucy AI and personalized recommendations.",
            "Analyze usage patterns to optimize user experience and features.",
            "Prevent fraud, monitor security, and ensure compliance.",
            "Send account notifications, updates, or marketing communications (with your consent)."
          ]
        },
        "3": {
          title: "3. Data Sharing & Third Parties",
          subsections: [
            { title: "Service Providers:", content: "We may share data with third parties (e.g., cloud services, analytics, payment processors, email providers) solely to deliver the Service." },
            { title: "Legal Requirements:", content: "We may disclose data to comply with laws, regulations, court orders, or government requests." },
            { title: "Business Transfers:", content: "In the event of a merger, acquisition, or asset sale, personal data may be transferred as business assets." }
          ]
        },
        "4": {
          title: "4. Your Rights",
          intro: "For users in the EEA (GDPR rights) and California (CCPA rights), you have the right to:",
          items: [
            { label: "Access:", content: "Obtain a copy of your personal data." },
            { label: "Rectification:", content: "Correct or update inaccurate data." },
            { label: "Deletion:", content: "Request deletion of personal data, where permitted by law." },
            { label: "Restriction:", content: "Limit processing of your data in certain cases." },
            { label: "Data Portability:", content: "Receive your data in a structured, commonly used format." },
            { label: "Object:", content: "Object to data processing for specific purposes (e.g., marketing)." },
            { label: "Withdraw Consent:", content: "Withdraw consent for data processing at any time." }
          ],
          outro: "To exercise these rights, contact us via the details in Section 11. We will respond within legal timeframes."
        },
        "5": {
          title: "5. Data Retention",
          content: "We retain personal data only as long as necessary to fulfill the purposes outlined or as required by law. After retention periods expire, we securely delete or anonymize data."
        },
        "6": {
          title: "6. International Data Transfers",
          content: "To operate the Service, we may transfer and store data globally. For EEA users, we implement appropriate safeguards (e.g., Standard Contractual Clauses) to ensure lawful transfers."
        },
        "7": {
          title: "7. Security Measures",
          content: "We employ industry-standard technical and organizational measures, including encryption, access controls, and regular security audits, to protect your data against unauthorized access, disclosure, or alteration."
        },
        "8": {
          title: "8. Minors",
          content: "Our Service is intended for users aged 16 and older. We do not knowingly collect personal data from minors under 16. If we learn we have collected such data, we will promptly delete it."
        },
        "9": {
          title: "9. Cookies & Tracking",
          content: "We use cookies and similar technologies to improve your experience. You can manage or disable cookies via your browser or device settings, though this may affect functionality."
        },
        "10": {
          title: "10. Policy Updates",
          content: "We may update this Policy from time to time. Significant changes will be communicated at least 30 days before they take effect via in-app notifications or email."
        },
        "11": {
          title: "11. Contact Us",
          intro: "For questions or to exercise your rights, please contact us:",
          email: "Email: support@lucyai.io"
        }
      },
      footer: "Thank you for trusting Lucy AI. We are committed to safeguarding your privacy and data security."
    },
    zh: {
      title: "Lucy AI 隐私政策",
      effectiveDate: "生效日期：2025 年 7 月 5 日",
      introduction: "本隐私政策（\"政策\"）适用于由 BLUE BOX AI LIMITED（以下简称\"公司\"或\"我们\"）开发并运营的 Lucy AI 服务（以下简称\"服务\"）。我们尊重并保护用户（以下简称\"您\"）的隐私权，并严格遵守美国及欧洲经济区（EEA） 相关法律法规，包括《通用数据保护条例》（GDPR） 和加州消费者隐私法案（CCPA）。",
      sections: {
        "1": {
          title: "1. 我们收集哪些数据",
          items: [
            { label: "注册信息：", content: "用户名、电子邮件地址等。" },
            { label: "个人资料与偏好：", content: "您提供给我们的基本信息，用于提升服务体验。" },
            { label: "使用数据：", content: "登录、功能使用、会话记录、AI 生成内容等操作日志。" },
            { label: "设备与技术信息：", content: "IP 地址、设备标识符、操作系统、浏览器类型及版本。" },
            { label: "Cookie 与类似技术：", content: "用于记忆您在我们的应用或网页中的偏好和会话状态。" }
          ]
        },
        "2": {
          title: "2. 我们如何使用数据",
          intro: "我们将您的数据用于：",
          items: [
            "提供、维护和改进 Lucy AI 服务及个性化推荐",
            "分析使用行为，优化用户体验和产品功能",
            "防止欺诈、安全监控及服务合规",
            "向您发送账户通知、更新或营销通讯（经您同意后）"
          ]
        },
        "3": {
          title: "3. 数据共享与第三方",
          subsections: [
            { title: "服务提供商：", content: "我们可能与云服务、数据分析、支付处理、邮件发送等第三方供应商共享数据，限于为您提供服务所必需。" },
            { title: "法律要求：", content: "在法律、法规、法院命令或政府请求下，我们可能披露您的个人数据。" },
            { title: "企业合并与收购：", content: "若公司发生合并、收购或资产出售，您的个人数据可能作为业务资产转移。" }
          ]
        },
        "4": {
          title: "4. 您的权利",
          intro: "对于欧洲用户（GDPR 权利）和加州用户（CCPA 权利），您享有以下权利：",
          items: [
            { label: "访问权：", content: "获取我们持有的您的个人数据副本。" },
            { label: "更正权：", content: "纠正或补充不准确或不完整的数据。" },
            { label: "删除权：", content: "在法律允许范围内请求删除您的个人数据。" },
            { label: "限制处理：", content: "在特定情况下限制我们对您数据的处理。" },
            { label: "数据可携带权：", content: "将个人数据以结构化、常用格式导出。" },
            { label: "反对权：", content: "出于特定目的（如营销）反对我们的数据处理。" },
            { label: "撤回同意：", content: "对于基于您同意的数据处理，您可以随时撤回同意。" }
          ],
          outro: "如需行使上述权利，请通过我们的联系渠道提交请求。我们将在法定期限内予以回复。"
        },
        "5": {
          title: "5. 数据保留",
          content: "我们仅在实现收集目的所必需的期限内保留您的个人数据，或依据法律法规要求保留更长时间。保留期结束后，我们将安全删除或匿名化您的数据。"
        },
        "6": {
          title: "6. 国际数据传输",
          content: "为保证服务运行，我们可能在全球范围内传输和存储数据。对欧洲用户，我们会采取适当的数据传输机制（如标准合同条款），确保数据传输安全合规。"
        },
        "7": {
          title: "7. 安全措施",
          content: "我们采用行业最佳实践的技术和组织措施，包括数据加密、访问控制、定期安全审计，以保护您的个人数据免受未经授权的访问、披露或篡改。"
        },
        "8": {
          title: "8. 未成年人保护",
          content: "我们的服务面向 16 岁及以上用户。我们不会有意收集 16 岁以下未成年人的个人数据。如发现误收，我们将尽快删除相关信息。"
        },
        "9": {
          title: "9. Cookie 与追踪",
          content: "我们使用 Cookie 及类似技术改善用户体验。您可通过浏览器或设备设置管理或拒绝 Cookie，但这可能影响部分功能使用。"
        },
        "10": {
          title: "10. 政策更新",
          content: "我们可能会不时更新本政策，并在应用内或通过邮件通知您最新版本。重大变更将在生效前 30 天告知。"
        },
        "11": {
          title: "11. 联系我们",
          intro: "若对本隐私政策有任何疑问或行使隐私权，欢迎联系：",
          email: "电子邮件：support@lucyai.io"
        }
      },
      footer: "感谢您信任 Lucy AI，我们致力于保护您的隐私，保障您的数据安全。"
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

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{currentContent.sections["1"].title}</h2>
          <ul className="space-y-2 text-gray-700">
            {currentContent.sections["1"].items.map((item, index) => (
              <div key={index}>
                <h3 className="font-semibold mb-2">{item.label}</h3>
                <span>{item.content}</span>
              </div>
            ))}
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{currentContent.sections["2"].title}</h2>
          <p className="text-gray-700 mb-4">{currentContent.sections["2"].intro}</p>
          <ul className="space-y-2 text-gray-700 list-disc pl-6">
            {currentContent.sections["2"].items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{currentContent.sections["3"].title}</h2>
          <div className="space-y-4 text-gray-700">
            {currentContent.sections["3"].subsections.map((subsection, index) => (
              <div key={index}>
                <h3 className="font-semibold mb-2">{subsection.title}</h3>
                <p>{subsection.content}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{currentContent.sections["4"].title}</h2>
          <p className="text-gray-700 mb-4">{currentContent.sections["4"].intro}</p>
          <ul className="space-y-2 text-gray-700">
            {currentContent.sections["4"].items.map((item, index) => (
              <li key={index}>
                <span className="font-medium">{item.label}</span> {item.content}
              </li>
            ))}
          </ul>
          <p className="text-gray-700 mt-4">{currentContent.sections["4"].outro}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{currentContent.sections["5"].title}</h2>
          <p className="text-gray-700">{currentContent.sections["5"].content}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{currentContent.sections["6"].title}</h2>
          <p className="text-gray-700">{currentContent.sections["6"].content}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{currentContent.sections["7"].title}</h2>
          <p className="text-gray-700">{currentContent.sections["7"].content}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{currentContent.sections["8"].title}</h2>
          <p className="text-gray-700">{currentContent.sections["8"].content}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{currentContent.sections["9"].title}</h2>
          <p className="text-gray-700">{currentContent.sections["9"].content}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{currentContent.sections["10"].title}</h2>
          <p className="text-gray-700">{currentContent.sections["10"].content}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{currentContent.sections["11"].title}</h2>
          <p className="text-gray-700 mb-4">{currentContent.sections["11"].intro}</p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800 font-medium">{currentContent.sections["11"].email}</p>
          </div>
        </section>

        <div className="border-t border-gray-200 pt-8 mt-8">
          <p className="text-gray-600 text-center italic">
            {currentContent.footer}
          </p>
        </div>
      </div>
    </div>
  );
}
import Icon from "@/components/icon";
import { Section as SectionType } from "@/types/blocks/section";

export default function LucyFeature({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  return (
    <div className="relative py-20">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-40 h-40 bg-gradient-primary rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-secondary rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob animation-delay-2000"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* 标题部分 */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gradient-primary mb-6 leading-tight">
              {section.title}
            </h2>
            {section.description && (
              <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
                {section.description}
              </p>
            )}
          </div>

          {/* 功能卡片网格 */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {section.items?.map((item, i) => {
              // 根据索引确定渐变色和发光效果
              const gradients = [
                'bg-gradient-primary',
                'bg-gradient-secondary', 
                'bg-gradient-accent'
              ];
              
              const glowEffects = [
                'glow-primary',
                'glow-secondary',
                'glow-accent'
              ];

              const textColors = [
                'text-white',
                'text-white',
                'text-accent-green-foreground'
              ];

              return (
                <div key={i} className="card-glass rounded-2xl p-8 text-center hover-lift group">
                  {item.icon && (
                    <div className={`w-16 h-16 ${gradients[i % gradients.length]} rounded-2xl flex items-center justify-center mx-auto mb-6 ${glowEffects[i % glowEffects.length]} group-hover:pulse-glow transition-all duration-300`}>
                      <Icon name={item.icon} className={`size-8 ${textColors[i % textColors.length]}`} />
                    </div>
                  )}
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-4 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-foreground/80 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 
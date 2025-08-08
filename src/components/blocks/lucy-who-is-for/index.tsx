import React from 'react';
import Image from 'next/image';

const LucyWhoIsFor = () => {
  const cards = [
    {
      icon: (
        <Image
          src="/imgs/lucy/who_icon_1.png"
          alt="App Users Icon"
          width={48}
          height={48}
          className="object-contain w-full h-full"
        />
      ),
      title: "App Users Struggling with Match Quality",
      description: "People using Tinder, Hinge, or Bumble but struggling with poor match quality"
    },
    {
      icon: (
        <Image
          src="/imgs/lucy/who_icon_2.png"
          alt="Profile Improvement Icon"
          width={48}
          height={48}
          className="object-contain w-full h-full"
        />
      ),
      title: "Profile Improvement Seekers",
      description: "Those who want a more attractive profile but don't know how to write it"
    },
    {
      icon: (
        <Image
          src="/imgs/lucy/who_icon_3.png"
          alt="Conversation Starters Icon"
          width={48}
          height={48}
          className="object-contain w-full h-full"
        />
      ),
      title: "Conversation Starters",
      description: "Anyone unsure how to break the ice or start meaningful chats"
    },
    {
      icon: (
        <Image
          src="/imgs/lucy/who_icon_4.png"
          alt="Serious Daters Icon"
          width={48}
          height={48}
          className="object-contain w-full h-full"
        />
      ),
      title: "Serious Daters",
      description: "Serious daters who value their time and want better results"
    }
  ];

  return (
    <section className="relative bg-[#5D30FF] overflow-hidden py-16 sm:py-20 lg:py-24 min-h-[620px] flex items-center">
      {/* 左上贝塞尔曲线 - 响应式尺寸 */}
      <div className="absolute top-0 left-0 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 opacity-50">
        <svg viewBox="0 0 400 400" className="w-full h-full">
          <path
            d="M0,0 Q200,100 400,0 L400,200 Q200,100 0,200 Z"
            fill="#2B05B5"
          />
        </svg>
      </div>

      {/* 右下贝塞尔曲线 - 响应式尺寸 */}
      <div className="absolute bottom-0 right-0 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 opacity-50">
        <svg viewBox="0 0 400 400" className="w-full h-full">
          <path
            d="M0,400 Q200,300 400,400 L400,200 Q200,300 0,200 Z"
            fill="#2B05B5"
          />
        </svg>
      </div>

      {/* 左下心形 - 响应式尺寸和位置 */}
      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 lg:bottom-8 lg:left-8 w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16">
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <path
            d="M32,54 C32,54 6,35 6,20 C6,13 11,8 18,8 C23,8 27,11 32,16 C37,11 41,8 46,8 C53,8 58,13 58,20 C58,35 32,54 32,54 Z"
            fill="#C8FB75"
          />
        </svg>
      </div>

      {/* 右上心形 - 响应式尺寸和位置 */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-8 lg:right-8 w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16">
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <path
            d="M32,54 C32,54 6,35 6,20 C6,13 11,8 18,8 C23,8 27,11 32,16 C37,11 41,8 46,8 C53,8 58,13 58,20 C58,35 32,54 32,54 Z"
            fill="#FFABEC"
          />
        </svg>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* 标题部分 - 响应式字体 */}
        <div className="text-center mb-10 sm:mb-14 lg:mb-18">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
            Who Is <span className="text-[#FF67DD]">Lucy</span> For?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-white/80 max-w-2xl mx-auto px-4">
            Perfect for anyone looking to improve their dating game
          </p>
        </div>

        {/* 卡片网格 - 响应式布局 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-3 max-w-5xl mx-auto">
          {cards.map((card, index) => (
            <div key={index} className="bg-white overflow-hidden w-full max-w-xs mx-auto flex flex-col transition-all duration-300 ease-in-out hover:transform hover:scale-105 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group">
              {/* 上半部分 - 粉色背景 */}
              <div className="bg-[#FF67DD] flex justify-center items-center py-8 sm:py-10 lg:py-12 transition-colors duration-300 group-hover:bg-[#FF4FD1]">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  {card.icon}
                </div>
              </div>
              
              {/* 下半部分 - 白色背景 */}
              <div className="bg-white p-4 sm:p-5 lg:p-6 flex-1 flex flex-col justify-center transition-colors duration-300 group-hover:bg-gray-50">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 leading-tight text-center transition-colors duration-300 group-hover:text-[#FF67DD]">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed text-center transition-colors duration-300 group-hover:text-gray-700">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LucyWhoIsFor; 
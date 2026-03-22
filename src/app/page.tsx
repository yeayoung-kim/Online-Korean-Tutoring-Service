import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Yeayoung Korean!</h1>
            </div>

          </div>  
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to Korean World!
          </h1>
                      <p className="text-lg text-gray-500 mb-4 max-w-3xl mx-auto">
             🌿 When Korean feels difficult, this is a class you can enjoy and feel comfortable with! Learn Korean in an exciting, fun, and relaxed way! 🔥
            </p>
            <p className="text-lg text-gray-500 mb-8 max-w-3xl mx-auto">
             📝 We send you a summary of each lesson after class ends.<br/>
             📚 We create personalized books tailored to each individual!
            </p>
                     <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <Link
               href="/book"
               className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors duration-200"
             >
               Book Your Lesson
             </Link>
             <Link
               href="/newsletter"
               className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors duration-200"
             >
               Subscribe to Newsletter
             </Link>
           </div>
           
           {/* Contact Information */}
           <div className="mt-8 text-center">
             <p className="text-gray-600 mb-4">📱 Follow us on social media or send us an email!</p>
             <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
               <div className="flex items-center space-x-2">
                 <span className="text-2xl">📸</span>
                 <span className="text-gray-700">Instagram:</span>
                 <a 
                   href="https://www.instagram.com/yeayoung.korean?igsh=MXBoMWNyaXUxd2RyeA%3D%3D&utm_source=qr" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="text-blue-600 hover:text-blue-800 font-medium"
                 >
                   @yeayoung.korean
                 </a>
               </div>
               <div className="flex items-center space-x-2">
                 <span className="text-2xl">📧</span>
                 <span className="text-gray-700">Email:</span>
                 <a 
                   href="mailto:yeayoungkim.22@gmail.com"
                   className="text-blue-600 hover:text-blue-800 font-medium"
                 >
                   yeayoungkim.22@gmail.com
                 </a>
               </div>
             </div>
           </div>
        </div>

                 {/* Curriculum Levels Section */}
         <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
             <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
               <span className="text-2xl">🌱</span>
             </div>
             <h3 className="text-xl font-semibold text-gray-900 mb-4">Beginner Level</h3>
             <ul className="text-gray-600 space-y-2 text-base leading-relaxed">
               <li className="flex items-start">
                 <span className="text-blue-500 mr-2 mt-1">•</span>
                 Learn the alphabet step by step with pronunciation-focused lessons
               </li>
               <li className="flex items-start">
                 <span className="text-blue-500 mr-2 mt-1">•</span>
                 Master basic grammar and natural Korean word order
               </li>
               <li className="flex items-start">
                 <span className="text-blue-500 mr-2 mt-1">•</span>
                 Sentence-making focused classes with plenty of speaking time
               </li>
               <li className="flex items-start">
                 <span className="text-blue-500 mr-2 mt-1">•</span>
                 Write Korean diaries with feedback outside class time
               </li>
               <li className="flex items-start">
                 <span className="text-blue-500 mr-2 mt-1">•</span>
                 Beginner vocabulary book with tests every lesson
               </li>
             </ul>
           </div>

           <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
             <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
               <span className="text-2xl">📚</span>
             </div>
             <h3 className="text-xl font-semibold text-gray-900 mb-4">Intermediate Level</h3>
             <ul className="text-gray-600 space-y-2 text-base leading-relaxed">
               <li className="flex items-start">
                 <span className="text-green-500 mr-2 mt-1">•</span>
                 Learn advanced grammar to upgrade Korean expression skills
               </li>
               <li className="flex items-start">
                 <span className="text-green-500 mr-2 mt-1">•</span>
                 Sentence-making focused classes where you'll speak Korean extensively
               </li>
               <li className="flex items-start">
                 <span className="text-green-500 mr-2 mt-1">•</span>
                 Natural Korean word order becomes second nature
               </li>
               <li className="flex items-start">
                 <span className="text-green-500 mr-2 mt-1">•</span>
                 Learn Korean diaries and honorifics with practice to distinguish formal and informal speech
               </li>
               <li className="flex items-start">
                 <span className="text-green-500 mr-2 mt-1">•</span>
                 Intermediate vocabulary book provided with dictation tests
               </li>
             </ul>
           </div>

           <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
             <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
               <span className="text-2xl">🏆</span>
             </div>
             <h3 className="text-xl font-semibold text-gray-900 mb-4">Advanced Level</h3>
             <ul className="text-gray-600 space-y-2 text-base leading-relaxed">
               <li className="flex items-start">
                 <span className="text-purple-500 mr-2 mt-1">•</span>
                 Prepare for TOPIK I & II with optimized vocabulary books and tests every lesson
               </li>
               <li className="flex items-start">
                 <span className="text-purple-500 mr-2 mt-1">•</span>
                 Read newsletters together and organize unfamiliar expressions
               </li>
               <li className="flex items-start">
                 <span className="text-purple-500 mr-2 mt-1">•</span>
                 Write long-form content like newsletter summaries and reflections
               </li>
               <li className="flex items-start">
                 <span className="text-purple-500 mr-2 mt-1">•</span>
                 Learn nuances that only native Koreans understand
               </li>
             </ul>
           </div>
         </div>

         {/* YouTube Video Section */}
         <div className="mt-20 max-w-4xl mx-auto px-4">
           <div className="text-center mb-8">
             <h2 className="text-3xl font-bold text-gray-900 mb-4">
               🎥 Watch Our Teaching Style
             </h2>
             <p className="text-lg text-gray-600">
               See how we make Korean learning fun and effective!
             </p>
           </div>
           <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                            <iframe
                 className="absolute top-0 left-0 w-full h-full rounded-2xl shadow-lg"
                 src="https://www.youtube.com/embed/l6O4VaUzVBA"
                 title="Korean Learning with Yeayoung"
                 frameBorder="0"
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
               allowFullScreen
             ></iframe>
           </div>
         </div>

         {/* Student Achievements Section */}
         <div className="mt-20 bg-gradient-to-r from-blue-50 to-indigo-50 py-16 px-4">
           <div className="max-w-4xl mx-auto">
             <div className="text-center mb-12">
               <h2 className="text-4xl font-bold text-gray-900 mb-4">
                 🎯 Achievements of Students Who Studied With Me
               </h2>
               <p className="text-lg text-gray-600">
                 Real results from real students - see the transformation in action!
               </p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                 <div className="flex items-center mb-4">
                   <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                     <span className="text-2xl">🌱</span>
                   </div>
                   <h3 className="text-xl font-semibold text-gray-900">Beginner Success</h3>
                 </div>
                 <p className="text-gray-600 leading-relaxed">
                   A complete beginner student became able to naturally speak basic greetings and self-introductions in just one month!
                 </p>
               </div>

               <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                 <div className="flex items-center mb-4">
                   <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                     <span className="text-2xl">👂</span>
                   </div>
                   <h3 className="text-xl font-semibold text-gray-900">Pronunciation & Listening</h3>
                 </div>
                 <p className="text-gray-600 leading-relaxed">
                   Received feedback that pronunciation and listening skills improved remarkably after just a few lessons!
                 </p>
               </div>

               <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                 <div className="flex items-center mb-4">
                   <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                     <span className="text-2xl">🏆</span>
                   </div>
                   <h3 className="text-xl font-semibold text-gray-900">TOPIK Success</h3>
                 </div>
                 <p className="text-gray-600 leading-relaxed">
                   A student who prepared for TOPIK with me passed Level 4!
                 </p>
               </div>

               <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                 <div className="flex items-center mb-4">
                   <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                     <span className="text-2xl">💪</span>
                   </div>
                   <h3 className="text-xl font-semibold text-gray-900">Confidence Boost</h3>
                 </div>
                 <p className="text-gray-600 leading-relaxed">
                   Most importantly, many students say the biggest change is gaining confidence to start speaking!
                 </p>
               </div>
             </div>
           </div>
         </div>

         {/* Student Reviews Section */}
         <div className="mt-20 bg-gray-50 py-16 px-4">
           <div className="max-w-6xl mx-auto">
             <div className="text-center mb-12">
               <h2 className="text-4xl font-bold text-gray-900 mb-4">
                 ⭐ What Our Students Say
               </h2>
               <p className="text-lg text-gray-600">
                 Real feedback from real students who transformed their Korean journey with us!
               </p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* Review 1 */}
               <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
                 <div className="flex items-center mb-6">
                   <div className="flex space-x-1">
                     {[...Array(5)].map((_, i) => (
                       <span key={i} className="text-yellow-400 text-xl">★</span>
                     ))}
                   </div>
                 </div>
                 <p className="text-gray-700 text-base leading-relaxed mb-6 flex-grow">
                   "Hello! Teacher Yeyoung When I first met Elly she greeted me with a big smile! I felt comfortable from our very first class. She gives me so much positive feedback! It's really refreshing especially since learning a new language can be intimidating. In class she will break down how the grammar points are used and then we make sentences together. I am still expanding my vocabulary so my sentences aren't the best but her positivity keeps me motivated. I really appreciate all the time and effort she puts into her class. I really encourage you to try her class! Thank you."
                 </p>
                 <div className="flex justify-end items-end">
                   <p className="font-semibold text-gray-900 text-lg">- Sarah M.</p>
                 </div>
               </div>

               {/* Review 2 */}
               <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
                 <div className="flex items-center mb-6">
                   <div className="flex space-x-1">
                     {[...Array(5)].map((_, i) => (
                       <span key={i} className="text-yellow-400 text-xl">★</span>
                     ))}
                   </div>
                 </div>
                 <p className="text-gray-700 text-base leading-relaxed mb-6 flex-grow">
                   "yeayoung is an outstanding tutor and has a wide range of teaching strategies that will help you to improve your Korean. She takes her time and adapts the lessons to your learning speed. She also provides you with comprehensive notes after each class that allow you to review what you just learned. She is highly recommended if you are looking to improve any aspect of your Korean!"
                 </p>
                 <div className="flex justify-end items-end">
                   <p className="font-semibold text-gray-900 text-lg">- Michael R.</p>
                 </div>
               </div>

               {/* Review 3 */}
               <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
                 <div className="flex items-center mb-6">
                   <div className="flex space-x-1">
                     {[...Array(5)].map((_, i) => (
                       <span key={i} className="text-yellow-400 text-xl">★</span>
                     ))}
                   </div>
                 </div>
                 <p className="text-gray-700 text-base leading-relaxed mb-6 flex-grow">
                   "yeayoung is truly the best teacher ever! Her energy, kindness, and patience are truly amazing. Every class with her is fun and I always learn so much without even realizing how fast time flies! She explains everything clearly, encourages me constantly, and makes me feel confident to speak Korean. I never feel afraid to make mistakes in her class because she always supports me with a warm smile. I'm really grateful to be learning from her and I can't wait for our next lesson!"
                 </p>
                 <div className="flex justify-end items-end">
                   <p className="font-semibold text-gray-900 text-lg">- Emma L.</p>
                 </div>
               </div>

               {/* Review 4 */}
               <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
                 <div className="flex items-center mb-6">
                   <div className="flex space-x-1">
                     {[...Array(5)].map((_, i) => (
                       <span key={i} className="text-yellow-400 text-xl">★</span>
                     ))}
                   </div>
                 </div>
                 <p className="text-gray-700 text-base leading-relaxed mb-6 flex-grow">
                   "She is great 🤩 She is very lovely and energetic during the lesson. She is teaching my ten years old daughter and very good at it."
                 </p>
                 <div className="flex justify-end items-end">
                   <p className="font-semibold text-gray-900 text-lg">- Jennifer K.</p>
                 </div>
               </div>

               {/* Review 5 */}
               <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
                 <div className="flex items-center mb-6">
                   <div className="flex space-x-1">
                     {[...Array(5)].map((_, i) => (
                       <span key={i} className="text-yellow-400 text-xl">★</span>
                     ))}
                   </div>
                 </div>
                 <p className="text-gray-700 text-base leading-relaxed mb-6 flex-grow">
                   "She's a great teacher! Really patient and helps explain if you have any struggles. And she just has really bright energy😊"
                 </p>
                 <div className="flex justify-end items-end">
                   <p className="font-semibold text-gray-900 text-lg">- David P.</p>
                 </div>
               </div>

               {/* Review 6 */}
               <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
                 <div className="flex items-center mb-6">
                   <div className="flex space-x-1">
                     {[...Array(5)].map((_, i) => (
                       <span key={i} className="text-yellow-400 text-xl">★</span>
                     ))}
                   </div>
                 </div>
                 <p className="text-gray-700 text-base leading-relaxed mb-6 flex-grow">
                   "yeayoung is such a great teacher!! She helps me clean up my pronunciation and vocabulary in such a fun and interactive way that makes me excited for every lesson. Learning Korean is so fun with yeayoung and I definitely recommend her to anyone who wants to start learning the language. She's patient, supportive, and always makes sure I understand everything before moving on. I've gained so much confidence in speaking thanks to her, and I always look forward to our next class!"
                 </p>
                 <div className="flex justify-end items-end">
                   <p className="font-semibold text-gray-900 text-lg">- Alex C.</p>
                 </div>
               </div>

               {/* Review 7 */}
               <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
                 <div className="flex items-center mb-6">
                   <div className="flex space-x-1">
                     {[...Array(5)].map((_, i) => (
                       <span key={i} className="text-yellow-400 text-xl">★</span>
                     ))}
                   </div>
                 </div>
                 <p className="text-gray-700 text-base leading-relaxed mb-6 flex-grow">
                   "I've been taking lessons with Elly for about a month, and my Korean has already improved a lot. She's patient, clear, and always makes the lessons fun and easy to follow. Highly recommend her for beginners!"
                 </p>
                 <div className="flex justify-end items-end">
                   <p className="font-semibold text-gray-900 text-lg">- Rachel T.</p>
                 </div>
               </div>

               {/* Review 8 */}
               <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
                 <div className="flex items-center mb-6">
                   <div className="flex space-x-1">
                     {[...Array(5)].map((_, i) => (
                       <span key={i} className="text-yellow-400 text-xl">★</span>
                     ))}
                   </div>
                 </div>
                 <p className="text-gray-700 text-base leading-relaxed mb-6 flex-grow">
                   "I've only had two lessons with Teacher Yeyoung so far, but they've been amazing! She has great energy, conducts my lessons entirely in Korean, and makes sure I understand everything. Her approach is really helping my listening skills, and she's so patient and attentive throughout the lesson. I already feel more confident, and I'm excited to keep learning with her!"
                 </p>
                 <div className="flex justify-end items-end">
                   <p className="font-semibold text-gray-900 text-lg">- Kevin W.</p>
                 </div>
               </div>

               {/* Review 9 */}
               <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
                 <div className="flex items-center mb-6">
                   <div className="flex space-x-1">
                     {[...Array(5)].map((_, i) => (
                       <span key={i} className="text-yellow-400 text-xl">★</span>
                     ))}
                   </div>
                 </div>
                 <p className="text-gray-700 text-base leading-relaxed mb-6 flex-grow">
                   "Learning with yeayoung is great - she is always well prepared, and I always enjoy the lessons. Highly recommended!"
                 </p>
                 <div className="flex justify-end items-end">
                   <p className="font-semibold text-gray-900 text-lg">- James B.</p>
                 </div>
               </div>

               {/* Review 10 */}
               <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
                 <div className="flex items-center mb-6">
                   <div className="flex space-x-1">
                     {[...Array(5)].map((_, i) => (
                       <span key={i} className="text-yellow-400 text-xl">★</span>
                     ))}
                   </div>
                 </div>
                 <p className="text-gray-700 text-base leading-relaxed mb-6 flex-grow">
                   "learning with yeayoung is really helpful, she always explains the necessary parts in a very fun way, is prepared well and sends many materials that let you practice outside the lessons. i would definitely recommend!!"
                 </p>
                 <div className="flex justify-end items-end">
                   <p className="font-semibold text-gray-900 text-lg">- Lisa H.</p>
                 </div>
               </div>
             </div>
           </div>
         </div>
        
      </main>
    </div>
  );
}

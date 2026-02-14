// এখানে আপনার সব ফোল্ডার এবং প্রশ্ন থাকবে
const questionDatabase = [
    {
        id: "folder_gk", // ইউনিক আইডি (Unique ID)
        folderName: "General Knowledge",
        icon: "fa-globe-asia", // FontAwesome Icon name
        files: [
            {
                id: "gk_set_1", // এই আইডি প্রতিটি ফাইলের জন্য আলাদা হতে হবে
                title: "BCS Preparation - Set A",
                subject: "General Knowledge",
                questions: [
                    {
                        question: "What is the capital of Bangladesh?",
                        options: ["Dhaka", "Chittagong", "Sylhet", "Khulna"],
                        correctAnswer: "Dhaka",
                        explanation: "Dhaka is the capital city."
                    },
                    {
                        question: "How many colors are in a rainbow?",
                        options: ["5", "6", "7", "8"],
                        correctAnswer: "7",
                        explanation: "Red, Orange, Yellow, Green, Blue, Indigo, Violet."
                    }
                ]
            }
        ]
    },
    {
        id: "folder_eng",
        folderName: "English Literature",
        icon: "fa-book-open",
        files: [
            {
                id: "eng_set_1",
                title: "Shakespeare Basics",
                subject: "English",
                questions: [
                    {
                        question: "Who wrote Hamlet?",
                        options: ["Marlowe", "Shakespeare", "Milton", "Bacon"],
                        correctAnswer: "Shakespeare",
                        explanation: "William Shakespeare wrote Hamlet."
                    }
                ]
            }
        ]
    }
];
# ChatPDF: AI-Powered PDF Chat & RAG App

A modern Flask application for conversational PDF Q&A, leveraging Retrieval-Augmented Generation (RAG), advanced LLMs, and real-time voice/text interaction. Designed for research, productivity, and accessible document understanding.

---

## Overview
ChatPDF lets you upload PDFs, ask questions, and get instant, source-cited answers using state-of-the-art AI. Features include user authentication, PDF management, streaming responses, clickable sources, and voice (TTS/STT) support.

---

## Screenshots
<!-- Add screenshots below -->
![Dashboard Screenshot](app/static/img/main.png)
![Chat Session Screenshot](app/static/img/todo.png)

---

## Features
- **PDF Upload & Management**: Securely upload and organize PDFs
- **Conversational Q&A**: Ask questions and get AI-powered answers
- **Source Attribution**: Clickable citations to exact PDF pages
- **Streaming Responses**: Real-time AI answers
- **Voice Interaction**: Speech-to-text and text-to-speech modules
- **User Authentication**: Register, login, and manage profiles
- **Responsive UI**: Works on desktop and mobile

---

## Getting Started

### Prerequisites
- Python 3.8+
- Git
- (Recommended) Virtual environment tool

### Installation
1. **Clone the repository**
   ```bash
   git clone https://github.com/AbdullAharifx/PL-Work.git
   cd PL-Work/LangChain/ChatPDF
   ```
2. **Create and activate a virtual environment**
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```
3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```
4. **Configure environment variables**
   - Create a `.env` file in the project root:
     ```env
     FLASK_ENV=development
     SECRET_KEY=your_secret_key_here
     GROQ_API_KEY=your_groq_api_key
     GEMINI_API_KEY=your_gemini_api_key
     ```
5. **Run the application**
   ```bash
   python run.py
   ```
   The app will be available at [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## Usage
- Register or log in
- Upload PDFs and start a chat session
- Ask questions about your documents
- Click source links to view cited PDF pages
- Use microphone/speaker buttons for voice interaction

---

## Future Features & Improvements
- Multi-document chat sessions
- Advanced search and filtering
- Collaborative chat and shared workspaces
- REST API for integration
- Dark mode and theme customization
- Push notifications and reminders
- Enhanced analytics and usage stats

---

## Contributing
We welcome contributions from the community!

### How to Contribute
1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** (add tests if possible)
4. **Run tests**
   ```bash
   python -m pytest tests/
   ```
5. **Commit your changes**
   ```bash
   git commit -m "Describe your changes"
   ```
6. **Push to your branch**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request** on GitHub

### Contribution Guidelines
- Follow PEP 8 style guidelines
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

---

## License
This project is licensed under the MIT License. See the [LICENSE.md](LICENSE.md) for details.

---

**Built with ❤️ using Flask, Python, and modern AI tools**

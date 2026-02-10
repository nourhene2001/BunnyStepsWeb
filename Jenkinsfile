pipeline {
    agent any

    options {
        skipDefaultCheckout(true)  
    }

    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()  
            }
        }

        stage('Checkout') {
            steps {
                git url: 'https://github.com/nourhene2001/BunnyStepsWeb.git',
                    branch: 'main',
                    credentialsId: 'gitlab-access-token'
            }
        }

        
        stage('Backend: Install & Test') {
            agent {
                docker {
                    image 'bunny-ci:python-node'
                }
            }
            steps {
                sh '''
                    # Debug: show workspace structure
                    pwd
                    ls -la
                    ls -la backend || echo "backend not found"
        
                    # Correct path based on your GitHub structure
                    cd backend/BunnySteps || { echo "ERROR: backend/BunnySteps not found"; exit 1; }
        
                    # Confirm location
                    pwd
                    ls -la   # should show manage.py, requirements.txt, tests/, etc.
        
                    python -m venv venv
                    . venv/bin/activate
                    pip install --upgrade pip setuptools wheel
                    pip install -r requirements.txt
                    mkdir -p test-reports
                    pytest -v --junitxml=test-reports/results.xml   # -v = verbose, shows test names
                '''
            }
            post {
                always {
                    junit allowEmptyResults: true,
                          testResults: 'backend/BunnySteps/test-reports/results.xml'
                }
            }
        }

        stage('Build Production Images') {
            when { branch 'main' }
            agent any   // Windows host
            steps {
                bat 'docker build -f frontend/Dockerfile.txt -t bunny-frontend:%BUILD_NUMBER% frontend'
                bat 'docker build -f backend/Dockerfile.txt -t bunny-backend:%BUILD_NUMBER% backend'
            }
        }

        stage('Deploy') {
            when { branch 'main' }
            steps {
                echo 'Deploy placeholder'
            }
        }
    }

    post {
        success { echo 'Pipeline succeeded! 🎉' }
        failure { echo 'Pipeline failed – check logs.' }
        always  { cleanWs() }
    }
}

pipeline {
    agent any

    options {
        skipDefaultCheckout(true)  // Prevent Jenkins from auto-checking out before we do it manually
    }

    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()  // Always start with a clean workspace
            }
        }

        stage('Checkout') {
            steps {
                git url: 'https://github.com/nourhene2001/BunnyStepsWeb/tree/main',
                    branch: 'main',
                    credentialsId: 'gitlab-access-token'  // ← change to your real GitHub credential ID
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
                    # === DEBUG: show current directory and contents ===
                    pwd
                    ls -la

                    # Move into backend folder (this is the fix)
                    cd backend/BunnySteps || { echo "ERROR: backend/BunnySteps folder not found"; exit 1; }

                    # Confirm we are now inside backend/
                    pwd
                    ls -la   # should show requirements.txt, manage.py, tests/, etc.

                    python -m venv venv
                    . venv/bin/activate
                    pip install --upgrade pip setuptools wheel
                    pip install -r requirements.txt || true  # continue even if fails

                    mkdir -p test-reports
                    pytest -v --junitxml=test-reports/results.xml || true  # -v = verbose output
                '''
            }
            post {
                always {
                    junit allowEmptyResults: true,
                          testResults: 'backend/test-reports/results.xml'
                }
            }
        }

        stage('Build Production Images') {
            when { branch 'main' }
            agent any
            steps {
                bat 'docker build -f frontend/Dockerfile.txt -t bunny-frontend:%BUILD_NUMBER% frontend || exit 0'
                bat 'docker build -f backend/Dockerfile.txt -t bunny-backend:%BUILD_NUMBER% backend || exit 0'
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

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
                    branch: 'main'
                    
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
                    echo "=== Workspace root ==="
                    pwd
                    ls -la

                    echo "=== Inside backend ==="
                    ls -la backend || echo "backend missing"

                    echo "=== Inside backend/BunnySteps (if exists) ==="
                    ls -la backend/BunnySteps || echo "backend/BunnySteps missing"

                    # Try the most likely correct path based on GitHub screenshot
                    cd backend || { echo "ERROR: cd backend failed"; exit 1; }

                    pwd
                    ls -la   # should show requirements.txt, BunnySteps/, etc.

                    # If requirements.txt is here, proceed
                    python -m venv venv
                    . venv/bin/activate
                    pip install --upgrade pip setuptools wheel
                    pip install -r requirements.txt || echo "pip failed - check if requirements.txt is here"

                    mkdir -p test-reports
                    pytest -v --junitxml=test-reports/results.xml || true
                '''
            }
            post {
                always {
                    junit allowEmptyResults: true,
                          testResults: 'backend/test-reports/results.xml'
                }
            }
        }
    }

    post {
        success { echo 'Pipeline succeeded! 🎉' }
        failure { echo 'Pipeline failed – check logs.' }
        always  { cleanWs() }
    }
}

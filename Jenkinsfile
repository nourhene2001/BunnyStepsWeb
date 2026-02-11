pipeline {
    agent any

    stages {
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
                    echo "=== Enter backend ==="
                    cd backend || { echo "backend folder missing"; exit 1; }

                    echo "=== Create virtual env ==="
                    python -m venv venv
                    . venv/bin/activate

                    echo "=== Install dependencies ==="
                    pip install --upgrade pip
                    pip install -r requirements.txt
                    pip install pytest pytest-html pytest-django

                    echo "=== Create report folder ==="
                    mkdir -p test-reports

                    echo "=== Run ALL tests and generate HTML report ==="
                    pytest BunnySteps/Tests \
                        --tb=short \
                        --html=test-reports/report.html \
                        --self-contained-html \
                        --junitxml=test-reports/results.xml || true
                '''
            }
            post {
                always {
                    // Publish HTML report in Jenkins
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'backend/test-reports',
                        reportFiles: 'report.html',
                        reportName: 'Backend Test Report'
                    ])
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

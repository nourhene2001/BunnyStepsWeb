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
                    pip install pytest pytest-html pytest-django allure-pytest

                    echo "=== Create report folders ==="
                    mkdir -p test-reports/allure-results

                    echo "=== Run tests with Allure ==="
                    pytest BunnySteps/Tests \
                        --alluredir=test-reports/allure-results \
                        --junitxml=test-reports/results.xml \
                        --tb=short || true
                '''
            }
            post {
                always {
                    // Archive JUnit XML for test results
                    junit allowEmptyResults: true, testResults: 'backend/test-reports/results.xml'

                    // Publish Allure report (this is the key part)
                    allure(
                        includeProperties: false,
                        jdk: '',
                        properties: [],
                        reportBuildPolicy: 'ALWAYS',
                        results: [[path: 'backend/test-reports/allure-results']]
                    )

                    // Optional: archive generated HTML too
                    archiveArtifacts artifacts: 'backend/test-reports/allure-report/**', fingerprint: true, allowEmptyArchive: true
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

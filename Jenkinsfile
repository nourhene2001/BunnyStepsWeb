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
                    pip install pytest pytest-html pytest-django allure-pytest allure-python-commons

                    echo "=== Create report folder ==="
                    mkdir -p test-reports

                    echo "=== Run ALL tests ==="
                    pytest BunnySteps/Tests \
                        -v \
                        --tb=short \
                        --alluredir=test-reports/allure-results \
                        --junitxml=test-reports/results.xml || true
                '''
            }
        post {
            always {
                // Force JAVA_HOME for Allure (Jenkins images usually have Java in /opt/java/openjdk)
                withEnv(['JAVA_HOME=/opt/java/openjdk']) {
                    junit allowEmptyResults: true,
                          testResults: 'backend/test-reports/results.xml'
        
                    allure includeProperties: false,
                           jdk: '',
                           results: [[path: 'backend/test-reports/allure-results']]
                }
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

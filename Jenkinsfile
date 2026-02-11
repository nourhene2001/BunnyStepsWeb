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
                sh '''
                    docker run --rm -v $PWD/backend/test-reports:/allure-results \
                               -v $PWD/backend/allure-report:/allure-report \
                               allure/allure:2.21.0 generate /allure-results -o /allure-report
                '''
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

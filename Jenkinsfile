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
                    echo "=== Checking CSS file ==="
                    ls -la BunnySteps/style.css
                    echo "=== Run ALL tests and generate HTML report ==="


                    pytest BunnySteps/Tests \
                        --tb=short \
                        --html=test-reports/report.html \
                        --css=BunnySteps/style.css \
                        --metadata "Project" "BunnyStepsWeb" \
                        --metadata "Build" "$BUILD_NUMBER" \
                        --metadata "Branch" "$BRANCH_NAME" \
                        --junitxml=test-reports/results.xml || true

                '''
            }
            post {
                always {
                    echo "=== Archiving reports ==="
                    archiveArtifacts artifacts: 'backend/test-reports/report.html', fingerprint: true
                    junit allowEmptyResults: true, testResults: 'backend/test-reports/results.xml'
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
